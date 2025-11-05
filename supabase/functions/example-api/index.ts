import { HubSpotClient } from '../_shared/hubspot-client.ts';
import { validateHubSpotSignature } from '../_shared/hubspot-signature.ts';

Deno.serve(async (req: Request) => {
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

      // If no signature headers found, reject the request
      if (!version) {
        console.log('❌ No HubSpot signature found - request rejected');
        return new Response(
          JSON.stringify({ error: 'HubSpot signature required. For development/testing, set REQUIRE_HUBSPOT_SIGNATURE=false' }),
          { status: 401, headers: { 'Content-Type': 'application/json' }}
        );
      }

      // If signature found but invalid, reject the request
      if (!valid) {
        console.log(`❌ Invalid HubSpot signature (${version})`);
        return new Response(
          JSON.stringify({ error: 'Invalid HubSpot signature' }),
          { status: 401, headers: { 'Content-Type': 'application/json' }}
        );
      }

      // Valid signature
      console.log(`✅ Valid HubSpot signature (${version})`);
    } else if (!REQUIRE_SIGNATURE) {
      console.log('⚠️  Signature validation DISABLED (dev mode)');
    }

    const url = new URL(req.url);
    const portal_id = parseInt(url.searchParams.get('portal_id') || '');

    if (!portal_id || isNaN(portal_id)) {
      return new Response(
        JSON.stringify({ error: 'Valid portal_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' }}
      );
    }

    const hubspot = new HubSpotClient({
      supabaseUrl: Deno.env.get('SUPABASE_URL')!,
      supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      portalId: portal_id,
    });

    const contacts = await hubspot.get('/crm/v3/objects/contacts?limit=10');

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

