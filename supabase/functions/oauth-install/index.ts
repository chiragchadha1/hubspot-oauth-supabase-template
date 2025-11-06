/**
 * OAuth Installation Endpoint
 *
 * Redirects users to HubSpot's OAuth authorization page.
 * After authorization, HubSpot will redirect back to oauth-callback.
 *
 * Usage: Direct users to this endpoint to install your app
 */

Deno.serve((req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const CLIENT_ID = Deno.env.get('HUBSPOT_CLIENT_ID');
    const REDIRECT_URI = Deno.env.get('HUBSPOT_REDIRECT_URI');

    if (!CLIENT_ID || !REDIRECT_URI) {
      return new Response(
        JSON.stringify({ error: 'Missing required environment variables' }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }

    const SCOPES = [
      'oauth',
      'crm.objects.contacts.read',
      'crm.objects.contacts.write'
    ].join(' ');

    const state = crypto.randomUUID();

    const authUrl = new URL('https://app.hubspot.com/oauth/authorize');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('state', state);

    return new Response(null, {
      status: 302,
      headers: {
        'Location': authUrl.toString(),
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('OAuth install error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' }}
    );
  }
});

