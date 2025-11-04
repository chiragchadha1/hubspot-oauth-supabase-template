// OAuth Callback Endpoint
// Handles the redirect from HubSpot after user authorization
// Exchanges authorization code for access/refresh tokens

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      return new Response(
        `OAuth Error: ${error}\n${url.searchParams.get('error_description') || ''}`,
        {
          status: 400,
          headers: { 'Content-Type': 'text/plain' }
        }
      );
    }

    if (!code) {
      return new Response('No authorization code provided', { status: 400 });
    }

    // Validate state parameter (implement CSRF protection in production)
    // if (!isValidState(state)) {
    //   return new Response('Invalid state parameter', { status: 400 });
    // }

    // Get environment variables
    const CLIENT_ID = Deno.env.get('HUBSPOT_CLIENT_ID');
    const CLIENT_SECRET = Deno.env.get('HUBSPOT_CLIENT_SECRET');
    const REDIRECT_URI = Deno.env.get('HUBSPOT_REDIRECT_URI');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response('Missing required environment variables', { status: 500 });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return new Response(`Failed to exchange code for tokens: ${errorText}`, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get portal ID from OAuth token info endpoint (most reliable method)
    const tokenInfoResponse = await fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${access_token}`, {
      method: 'GET',
    });

    if (!tokenInfoResponse.ok) {
      const errorText = await tokenInfoResponse.text();
      console.error('Failed to get token info:', errorText);
      return new Response('Failed to get account information', { status: 500 });
    }

    const tokenInfo = await tokenInfoResponse.json();
    const portal_id = tokenInfo.hub_id;

    if (!portal_id) {
      console.error('No hub_id in token info:', tokenInfo);
      return new Response('Failed to extract portal ID from token', { status: 500 });
    }

    // Calculate token expiration time
    const expires_at = new Date(Date.now() + expires_in * 1000);

    // Store tokens in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error: dbError } = await supabase
      .from('oauth_tokens')
      .upsert({
        portal_id: portal_id,
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expires_at.toISOString(),
        scopes: tokenData.scopes || [],
      }, {
        onConflict: 'portal_id',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(`Failed to store tokens: ${dbError.message}`, { status: 500 });
    }

    // Redirect to home page with portal_id (like the quickstart does)
    // This allows the home page to fetch and display actual HubSpot data
    const homeUrl = new URL('/functions/v1/index', SUPABASE_URL);
    homeUrl.searchParams.set('portal_id', portal_id.toString());

    return new Response(null, {
      status: 302,
      headers: {
        'Location': homeUrl.toString(),
      }
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(
      `Internal server error: ${error.message}`,
      { status: 500 }
    );
  }
});

