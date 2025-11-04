// Home Page - Displays after successful OAuth
// Similar to the HubSpot OAuth quickstart, this fetches and displays a contact

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HubSpotClient } from '../_shared/hubspot-client.ts';

serve(async (req: Request) => {
  try {
    // Get portal ID from query params (passed from callback)
    const url = new URL(req.url);
    const portal_id = parseInt(url.searchParams.get('portal_id') || '');

    if (!portal_id || isNaN(portal_id)) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>HubSpot OAuth App</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 2rem auto;
                padding: 2rem;
                background: #f7fafc;
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              h1 { color: #2d3748; }
              .button {
                display: inline-block;
                background: #ff7a59;
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
                margin-top: 1rem;
              }
              .button:hover {
                background: #ff5733;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🚀 HubSpot OAuth App</h1>
              <p>Welcome! This app demonstrates HubSpot OAuth 2.0 integration.</p>
              <a href="/oauth-install" class="button">Install App</a>
            </div>
          </body>
        </html>
        `,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Initialize HubSpot client
    const hubspot = new HubSpotClient({
      supabaseUrl: Deno.env.get('SUPABASE_URL')!,
      supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      portalId: portal_id,
    });

    // Fetch a contact to display (like the quickstart does)
    let contactHtml = '';
    try {
      const response = await hubspot.get('/crm/v3/objects/contacts?limit=1');

      if (response.results && response.results.length > 0) {
        const contact = response.results[0];
        const props = contact.properties;
        const firstName = props.firstname || 'Unknown';
        const lastName = props.lastname || '';
        const email = props.email || 'No email';

        contactHtml = `
          <div class="contact-card">
            <h3>📇 Sample Contact</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Contact ID:</strong> ${contact.id}</p>
          </div>
        `;
      } else {
        contactHtml = `
          <div class="contact-card">
            <h3>📇 No Contacts Found</h3>
            <p>This portal doesn't have any contacts yet. Create one in HubSpot!</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error fetching contact:', error);
      contactHtml = `
        <div class="contact-card error">
          <h3>⚠️ Error Fetching Contact</h3>
          <p>${error.message}</p>
        </div>
      `;
    }

    // Return success page with contact info (like quickstart)
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Success - HubSpot App</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 2rem auto;
              padding: 2rem;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 {
              color: #2d3748;
              margin-bottom: 1rem;
            }
            .success-header {
              text-align: center;
              margin-bottom: 2rem;
            }
            .success-icon {
              font-size: 3rem;
              margin-bottom: 0.5rem;
            }
            .info-box {
              background: #f7fafc;
              padding: 1rem;
              border-radius: 6px;
              margin-bottom: 1.5rem;
            }
            .info-box strong {
              color: #2d3748;
            }
            .contact-card {
              background: #f7fafc;
              padding: 1.5rem;
              border-radius: 6px;
              border-left: 4px solid #667eea;
              margin-bottom: 1.5rem;
            }
            .contact-card.error {
              border-left-color: #f56565;
              background: #fff5f5;
            }
            .contact-card h3 {
              margin-top: 0;
              color: #2d3748;
            }
            .contact-card p {
              margin: 0.5rem 0;
              color: #4a5568;
            }
            .api-example {
              background: #2d3748;
              color: #e2e8f0;
              padding: 1rem;
              border-radius: 6px;
              font-family: 'Monaco', 'Courier New', monospace;
              font-size: 0.9rem;
              overflow-x: auto;
            }
            .footer {
              text-align: center;
              color: #718096;
              font-size: 0.9rem;
              margin-top: 2rem;
            }
            .badge {
              display: inline-block;
              background: #48bb78;
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 0.85rem;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-header">
              <div class="success-icon">✅</div>
              <h1>OAuth Connection Successful!</h1>
              <span class="badge">Connected</span>
            </div>

            <div class="info-box">
              <p><strong>Portal ID:</strong> ${portal_id}</p>
              <p><strong>Status:</strong> Your app is now authorized and tokens are securely stored</p>
            </div>

            ${contactHtml}

            <h3>🎯 Next Steps</h3>
            <p>You can now make authenticated API calls to HubSpot. Try the example endpoint:</p>

            <div class="api-example">
GET /example-api?portal_id=${portal_id}
            </div>

            <div class="footer">
              <p>Powered by Supabase Edge Functions</p>
              <p>Based on <a href="https://github.com/HubSpot/oauth-quickstart-nodejs" target="_blank">HubSpot OAuth Quickstart</a></p>
            </div>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );

  } catch (error) {
    console.error('Index page error:', error);
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 600px;
              margin: 2rem auto;
              padding: 2rem;
            }
            .error {
              background: #fff5f5;
              border: 2px solid #f56565;
              padding: 2rem;
              border-radius: 8px;
            }
            h1 { color: #c53030; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>⚠️ Error</h1>
            <p>${error.message}</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
});

