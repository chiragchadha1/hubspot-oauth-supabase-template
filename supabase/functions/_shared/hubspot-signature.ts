/**
 * HubSpot Request Signature Validation
 *
 * Validates incoming requests from HubSpot using v3, v2, or v1 signature methods.
 * See: https://developers.hubspot.com/docs/api/webhooks/validating-requests
 */

/**
 * Validates v3 signature (HMAC-SHA256 with timestamp)
 * Used by: UI Extensions (hubspot.fetch), newer webhooks
 */
async function validateV3Signature(
  req: Request,
  body: string,
  clientSecret: string,
  signatureHeader: string,
  timestampHeader: string
): Promise<boolean> {
  const MAX_ALLOWED_TIMESTAMP = 300000; // 5 minutes in milliseconds
  const currentTime = Date.now();
  const requestTimestamp = parseInt(timestampHeader);

  // Reject requests with timestamps older than 5 minutes
  if (currentTime - requestTimestamp > MAX_ALLOWED_TIMESTAMP) {
    return false;
  }

  const parsedUrl = new URL(req.url);
  const pathAndQuery = parsedUrl.pathname + parsedUrl.search;
  const hostname = parsedUrl.hostname;

  // Reconstruct the original URL that HubSpot signed
  // Note: Supabase strips /functions/v1/ from the path, so we add it back
  let uri = `https://${hostname}/functions/v1${pathAndQuery}`;

  // Decode specific URL-encoded characters per HubSpot v3 specification
  const decodeMappings: Record<string, string> = {
    '%3A': ':', '%2F': '/', '%3F': '?', '%40': '@',
    '%21': '!', '%24': '$', '%27': "'", '%28': '(',
    '%29': ')', '%2A': '*', '%2C': ',', '%3B': ';'
  };

  for (const [encoded, decoded] of Object.entries(decodeMappings)) {
    uri = uri.replace(new RegExp(encoded, 'gi'), decoded);
  }

  const method = req.method;
  const sourceString = `${method}${uri}${body}${timestampHeader}`;

  // Generate HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(clientSecret);
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };
  const key = await crypto.subtle.importKey('raw', keyData, algorithm, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(sourceString));

  const hashArray = Array.from(new Uint8Array(signature));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));

  return hashBase64 === signatureHeader;
}

/**
 * Validates v2 signature (SHA-256)
 * Used by: Workflow webhook actions, CRM cards
 */
async function validateV2Signature(
  req: Request,
  body: string,
  clientSecret: string,
  signatureHeader: string
): Promise<boolean> {
  const parsedUrl = new URL(req.url);
  const hostname = parsedUrl.hostname;
  const pathAndQuery = parsedUrl.pathname + parsedUrl.search;

  // Reconstruct with https and /functions/v1/ (the original URL HubSpot called)
  const uri = `https://${hostname}/functions/v1${pathAndQuery}`;
  const method = req.method;

  // v2: clientSecret + method + uri + body
  const sourceString = `${clientSecret}${method}${uri}${body}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(sourceString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex === signatureHeader;
}

/**
 * Validates v1 signature (SHA-256, legacy)
 * Used by: Legacy webhooks
 */
async function validateV1Signature(
  body: string,
  clientSecret: string,
  signatureHeader: string
): Promise<boolean> {
  // v1: clientSecret + body
  const sourceString = `${clientSecret}${body}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(sourceString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex === signatureHeader;
}

/**
 * Validates HubSpot request signatures (v3, v2, or v1)
 *
 * @param req - The incoming request
 * @param body - The request body as a string
 * @param clientSecret - Your HubSpot app's client secret
 * @returns Object with validation result and version used
 */
export async function validateHubSpotSignature(
  req: Request,
  body: string,
  clientSecret: string
): Promise<{ valid: boolean; version: string | null }> {
  const v3Signature = req.headers.get('x-hubspot-signature-v3');
  const v3Timestamp = req.headers.get('x-hubspot-request-timestamp');
  const signatureVersion = req.headers.get('x-hubspot-signature-version');
  const signature = req.headers.get('x-hubspot-signature');

  // Try v3 first (latest version)
  if (v3Signature && v3Timestamp) {
    const isValid = await validateV3Signature(req, body, clientSecret, v3Signature, v3Timestamp);
    return { valid: isValid, version: 'v3' };
  }

  // Try v2
  if (signatureVersion === 'v2' && signature) {
    const isValid = await validateV2Signature(req, body, clientSecret, signature);
    return { valid: isValid, version: 'v2' };
  }

  // Try v1 (legacy)
  if (signatureVersion === 'v1' && signature) {
    const isValid = await validateV1Signature(body, clientSecret, signature);
    return { valid: isValid, version: 'v1' };
  }

  // No signature headers found
  return { valid: false, version: null };
}
