/**
 * Example API Endpoint
 *
 * Demonstrates HubSpot OAuth token storage and signature validation.
 * This endpoint fetches contacts from HubSpot using stored OAuth tokens.
 *
 * HubSpot automatically adds these query parameters:
 * - portalId: The HubSpot account ID
 * - userId: The user making the request
 * - userEmail: The user's email
 * - appId: Your app ID
 */

import { HubSpotClient } from '../_shared/hubspot-client.ts';
import { validateHubSpotSignature } from '../_shared/hubspot-signature.ts';

interface HubSpotListResponse {
  results: unknown[];
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-HubSpot-Signature-V3, X-HubSpot-Request-Timestamp, X-HubSpot-Signature, X-HubSpot-Signature-Version',
      },
    });
  }

  try {
    const bodyText = await req.text();
    const CLIENT_SECRET = Deno.env.get('HUBSPOT_CLIENT_SECRET');
    const REQUIRE_SIGNATURE = Deno.env.get('REQUIRE_HUBSPOT_SIGNATURE') !== 'false';

    // Validate HubSpot signature (supports v3, v2, and v1)
    if (CLIENT_SECRET && REQUIRE_SIGNATURE) {
      const { valid, version } = await validateHubSpotSignature(req, bodyText, CLIENT_SECRET);

      if (!version) {
        return new Response(
          JSON.stringify({ error: 'HubSpot signature required. For development/testing, set REQUIRE_HUBSPOT_SIGNATURE=false' }),
          { status: 401, headers: { 'Content-Type': 'application/json' }}
        );
      }

      if (!valid) {
        return new Response(
          JSON.stringify({ error: 'Invalid HubSpot signature' }),
          { status: 401, headers: { 'Content-Type': 'application/json' }}
        );
      }

      console.log(`✅ Valid HubSpot signature (${version})`);
    }

    // Extract portalId from query parameters (HubSpot adds this automatically)
    const url = new URL(req.url);
    const portal_id = parseInt(url.searchParams.get('portalId') || '');

    if (!portal_id || isNaN(portal_id)) {
      return new Response(
        JSON.stringify({ error: 'Valid portalId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' }}
      );
    }

    // Initialize HubSpot client with stored OAuth tokens
    const hubspot = new HubSpotClient({
      supabaseUrl: Deno.env.get('SUPABASE_URL')!,
      supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      portalId: portal_id,
    });

    // Example: Fetch contacts from HubSpot
    const contacts = await hubspot.get('/crm/v3/objects/contacts?limit=10') as HubSpotListResponse;

    return new Response(
      JSON.stringify({
        success: true,
        portal_id,
        contacts: contacts.results,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
