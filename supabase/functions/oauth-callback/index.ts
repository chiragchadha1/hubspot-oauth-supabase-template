import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      return new Response(
        `OAuth Error: ${error}\n${url.searchParams.get('error_description') || ''}`,
        { status: 400, headers: { 'Content-Type': 'text/plain' }}
      );
    }

    if (!code) {
      return new Response('No authorization code provided', { status: 400 });
    }

    const CLIENT_ID = Deno.env.get('HUBSPOT_CLIENT_ID');
    const CLIENT_SECRET = Deno.env.get('HUBSPOT_CLIENT_SECRET');
    const REDIRECT_URI = Deno.env.get('HUBSPOT_REDIRECT_URI');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response('Missing required environment variables', { status: 500 });
    }
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

    const tokenInfoResponse = await fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${access_token}`);

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

    const expires_at = new Date(Date.now() + expires_in * 1000);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: dbError } = await supabase
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

    const successMessage = `
✅ OAuth Installation Successful!

Your HubSpot app has been successfully connected.

Portal ID: ${portal_id}
Scopes: ${tokenData.scopes ? tokenData.scopes.join(', ') : 'N/A'}
Status: Tokens securely stored

You can now close this page.

---

🎨 Want to Customize This Success Page?

You have several options:

1. EDIT THIS MESSAGE
   • Open: supabase/functions/oauth-callback/index.ts
   • Modify the 'successMessage' variable
   • Redeploy: supabase functions deploy oauth-callback

2. REDIRECT TO YOUR APP
   • Replace the success message with a redirect:
   • return new Response(null, {
       status: 302,
       headers: { 'Location': 'https://yourapp.com/success?portal_id=' + portal_id }
     });

3. CREATE A CUSTOM HTML PAGE
   • Build your own success page and host it on:
     - Vercel: https://vercel.com (free)
     - Netlify: https://netlify.com (free)
     - GitHub Pages: https://pages.github.com (free)
   • Then redirect to it (see option 2)

4. USE A CUSTOM DOMAIN (Supabase Pro)
   • Custom domains allow serving HTML directly from Edge Functions
   • Learn more: https://supabase.com/docs/guides/platform/custom-domains

---

📖 Next Steps - Using Your OAuth Integration:

• Test API call: /functions/v1/example-api?portal_id=${portal_id}
• Read the docs: Check README.md for code examples
• HubSpot API reference: https://developers.hubspot.com/docs/api/overview

Your tokens are securely stored and will auto-refresh. Happy coding! 🚀
    `.trim();

    return new Response(successMessage, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      }
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      `Internal server error: ${errorMessage}`,
      { status: 500 }
    );
  }
});

