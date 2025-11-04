// OAuth Installation Endpoint
// Redirects user to HubSpot OAuth authorization page

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
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
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Define required scopes for your app
    const SCOPES = [
      'oauth',
      'crm.objects.contacts.read',
      'crm.objects.contacts.write'
    ].join(' ');

    // Generate state parameter for CSRF protection
    const state = crypto.randomUUID();

    // Store state in a cookie or session if needed
    // For production, implement state validation in callback

    // Build HubSpot OAuth authorization URL
    const authUrl = new URL('https://app.hubspot.com/oauth/authorize');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('state', state);

    // Redirect user to HubSpot OAuth page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': authUrl.toString(),
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('OAuth install error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

