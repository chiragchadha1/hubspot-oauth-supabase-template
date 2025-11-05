import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req: Request) => {
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
    const url = new URL(req.url);
    let portal_id: number;

    if (req.method === 'GET') {
      portal_id = parseInt(url.searchParams.get('portal_id') || '');
    } else {
      const body = await req.json();
      portal_id = body.portal_id;
    }

    if (!portal_id || isNaN(portal_id)) {
      return new Response(
        JSON.stringify({ error: 'Valid portal_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' }}
      );
    }

    const CLIENT_ID = Deno.env.get('HUBSPOT_CLIENT_ID');
    const CLIENT_SECRET = Deno.env.get('HUBSPOT_CLIENT_SECRET');
    const REDIRECT_URI = Deno.env.get('HUBSPOT_REDIRECT_URI');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing required environment variables' }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: tokenRecord, error: fetchError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('portal_id', portal_id)
      .single();

    if (fetchError || !tokenRecord) {
      return new Response(
        JSON.stringify({ error: 'No tokens found for this portal' }),
        { status: 404, headers: { 'Content-Type': 'application/json' }}
      );
    }

    const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        refresh_token: tokenRecord.refresh_token,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token refresh failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to refresh token', details: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;
    const expires_at = new Date(Date.now() + expires_in * 1000);

    const { error: updateError } = await supabase
      .from('oauth_tokens')
      .update({
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expires_at.toISOString(),
      })
      .eq('portal_id', portal_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update tokens', details: updateError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' }}
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        access_token: access_token,
        expires_at: expires_at.toISOString(),
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
    console.error('Token refresh error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

