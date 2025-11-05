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

  if (currentTime - requestTimestamp > MAX_ALLOWED_TIMESTAMP) {
    console.log('[v3] Timestamp is too old, rejecting request');
    return false;
  }

  const url = new URL(req.url);
  let uri = url.href;

  // Decode specific URL-encoded characters as per HubSpot docs
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

  const encoder = new TextEncoder();
  const keyData = encoder.encode(clientSecret);
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };
  const key = await crypto.subtle.importKey('raw', keyData, algorithm, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(sourceString));

  const hashArray = Array.from(new Uint8Array(signature));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));

  return hashBase64 === signatureHeader;
}

async function validateV2Signature(
  req: Request,
  body: string,
  clientSecret: string,
  signatureHeader: string
): Promise<boolean> {
  const url = new URL(req.url);
  const uri = url.href;
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

export async function validateHubSpotSignature(
  req: Request,
  body: string,
  clientSecret: string
): Promise<{ valid: boolean; version: string | null }> {
  // Try v3 first (latest version)
  const v3Signature = req.headers.get('X-HubSpot-Signature-V3');
  const v3Timestamp = req.headers.get('X-HubSpot-Request-Timestamp');

  if (v3Signature && v3Timestamp) {
    const isValid = await validateV3Signature(req, body, clientSecret, v3Signature, v3Timestamp);
    return { valid: isValid, version: 'v3' };
  }

  // Try v2
  const signatureVersion = req.headers.get('X-HubSpot-Signature-Version');
  const signature = req.headers.get('X-HubSpot-Signature');

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

