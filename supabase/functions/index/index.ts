import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HubSpotClient } from '../_shared/hubspot-client.ts';

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const portal_id = parseInt(url.searchParams.get('portal_id') || '');

    if (!portal_id || isNaN(portal_id)) {
      return new Response(
        JSON.stringify({
          error: 'Missing or invalid portal_id',
          message: 'Please provide a valid portal_id query parameter',
          example: '/functions/v1/index?portal_id=12345678'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' }}
      );
    }

    const hubspot = new HubSpotClient({
      supabaseUrl: Deno.env.get('SUPABASE_URL')!,
      supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      portalId: portal_id,
    });

    let sampleContact: any = null;
    let contactError: string | null = null;

    try {
      const response = await hubspot.get('/crm/v3/objects/contacts?limit=1');

      if (response.results && response.results.length > 0) {
        const contact = response.results[0];
        const props = contact.properties;
        sampleContact = {
          id: contact.id,
          firstname: props.firstname || 'Unknown',
          lastname: props.lastname || '',
          email: props.email || 'No email',
        };
      }
    } catch (error) {
      console.error('Error fetching contact:', error);
      contactError = error.message;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OAuth connection active',
        portal_id: portal_id,
        sample_contact: sampleContact,
        contact_error: contactError,
        next_steps: {
          message: 'You can now make authenticated API calls to HubSpot',
          example_endpoint: `/functions/v1/example-api?portal_id=${portal_id}`,
        }
      }, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );

  } catch (error) {
    console.error('Index page error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

