# Usage Examples

## Basic API Call

```typescript
import { HubSpotClient } from '../_shared/hubspot-client.ts';

const hubspot = new HubSpotClient({
  supabaseUrl: Deno.env.get('SUPABASE_URL')!,
  supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  portalId: 12345,
});

const contacts = await hubspot.get('/crm/v3/objects/contacts?limit=10');
```

## Create Contact

```typescript
const newContact = await hubspot.post('/crm/v3/objects/contacts', {
  properties: {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
    phone: '555-1234'
  }
});
```

## Update Contact

```typescript
await hubspot.patch('/crm/v3/objects/contacts/123', {
  properties: {
    phone: '555-5678'
  }
});
```

## Batch Operations

```typescript
const batch = await hubspot.post('/crm/v3/objects/contacts/batch/read', {
  inputs: [{ id: '123' }, { id: '456' }],
  properties: ['firstname', 'lastname', 'email']
});
```

## Search Contacts

```typescript
const results = await hubspot.post('/crm/v3/objects/contacts/search', {
  filterGroups: [{
    filters: [{
      propertyName: 'email',
      operator: 'CONTAINS',
      value: '@example.com'
    }]
  }],
  limit: 100
});
```

## Custom Endpoint Example

```typescript
// supabase/functions/sync-contacts/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HubSpotClient } from '../_shared/hubspot-client.ts';

serve(async (req: Request) => {
  const { portal_id } = await req.json();
  
  const hubspot = new HubSpotClient({
    supabaseUrl: Deno.env.get('SUPABASE_URL')!,
    supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    portalId: portal_id,
  });

  // Your sync logic here
  const contacts = await hubspot.get('/crm/v3/objects/contacts?limit=100');
  
  // Process contacts...
  
  return new Response(JSON.stringify({ synced: contacts.results.length }));
});
```

For more examples, see the [HubSpot API Documentation](https://developers.hubspot.com/docs/api/crm/contacts).
