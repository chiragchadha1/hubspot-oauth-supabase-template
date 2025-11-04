# 🚀 HubSpot OAuth Backend Template for Supabase

A complete, production-ready OAuth 2.0 backend for HubSpot apps built on Supabase. Deploy in minutes with automatic token refresh, secure storage, and a ready-to-use API client.

[![Deploy with Supabase](https://pipedream.com/s.v0/app_1dBhP3/logo/96)](https://supabase.com/dashboard/new)

## ✨ Features

- ✅ **Complete OAuth 2.0 Flow** - Handle HubSpot authorization seamlessly
- ✅ **Automatic Token Refresh** - Never worry about expired tokens
- ✅ **Secure PostgreSQL Storage** - Encrypted token storage with RLS
- ✅ **Edge Functions** - Fast, globally distributed serverless functions
- ✅ **TypeScript Ready** - Fully typed API client included
- ✅ **Production Ready** - Error handling, logging, and best practices built-in
- ✅ **100% Free Tier Compatible** - Works perfectly on Supabase free plan

## 🎯 What's Included

### Database
- `oauth_tokens` table with automatic timestamps and indexes
- Row-level security (RLS) policies
- Optimized for token lookups and expiration management

### Edge Functions
- **oauth-install** - Initiates OAuth flow, redirects to HubSpot
- **oauth-callback** - Handles redirect, exchanges code for tokens
- **oauth-refresh** - Automatically refreshes expired tokens
- **example-api** - Demonstrates authenticated HubSpot API calls

### Utilities
- **HubSpotClient** - Reusable client with automatic token refresh
- Pre-configured CORS and error handling
- Comprehensive logging for debugging

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- [Supabase account](https://supabase.com) (free)
- [HubSpot developer account](https://developers.hubspot.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed

### 1. Clone This Template

```bash
git clone https://github.com/yourusername/hubspot-oauth-supabase-template.git
cd hubspot-oauth-supabase-template
```

### 2. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Note your **Project Reference ID** and **API Keys**

### 3. Link to Your Project

```bash
supabase login
supabase link --project-ref your-project-ref
```

### 4. Deploy Database Schema

```bash
supabase db push
```

This creates the `oauth_tokens` table.

### 5. Get HubSpot Credentials

1. Go to https://developers.hubspot.com
2. Create or select your app
3. Go to **Auth** tab
4. Copy your **Client ID** and **Client Secret**
5. Set **Redirect URL** to: `https://your-project-ref.supabase.co/functions/v1/oauth-callback`

### 6. Configure Environment Variables

Set these secrets in Supabase:

```bash
supabase secrets set HUBSPOT_CLIENT_ID="your-client-id"
supabase secrets set HUBSPOT_CLIENT_SECRET="your-client-secret"
supabase secrets set HUBSPOT_REDIRECT_URI="https://your-project-ref.supabase.co/functions/v1/oauth-callback"
supabase secrets set SUPABASE_URL="https://your-project-ref.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Get your service role key:**
- Supabase Dashboard → Settings → API → `service_role` (secret)

### 7. Deploy Functions

```bash
supabase functions deploy oauth-install
supabase functions deploy oauth-callback
supabase functions deploy oauth-refresh
supabase functions deploy example-api
```

### 8. Test Your Setup! 🎉

Open this URL in your browser:
```
https://your-project-ref.supabase.co/functions/v1/oauth-install
```

You should:
1. Be redirected to HubSpot
2. See authorization screen
3. After authorizing, see success page with your Portal ID
4. See tokens stored in your Supabase database

## 📖 Usage

### Making Authenticated API Calls

Use the included `HubSpotClient` in your Edge Functions:

```typescript
import { HubSpotClient } from '../_shared/hubspot-client.ts';

// Initialize client
const hubspot = new HubSpotClient({
  supabaseUrl: Deno.env.get('SUPABASE_URL')!,
  supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  portalId: YOUR_PORTAL_ID,
});

// Make API calls - tokens refresh automatically!
const contacts = await hubspot.get('/crm/v3/objects/contacts?limit=10');
const companies = await hubspot.get('/crm/v3/objects/companies');

// Create a contact
const newContact = await hubspot.post('/crm/v3/objects/contacts', {
  properties: {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com'
  }
});

// Update a contact
await hubspot.patch('/crm/v3/objects/contacts/123', {
  properties: { phone: '555-1234' }
});

// Delete a contact
await hubspot.delete('/crm/v3/objects/contacts/123');
```

### Example: Create a Custom API Endpoint

```typescript
// supabase/functions/my-endpoint/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HubSpotClient } from '../_shared/hubspot-client.ts';

serve(async (req: Request) => {
  const url = new URL(req.url);
  const portalId = parseInt(url.searchParams.get('portal_id') || '');

  const hubspot = new HubSpotClient({
    supabaseUrl: Deno.env.get('SUPABASE_URL')!,
    supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    portalId,
  });

  // Your logic here
  const data = await hubspot.get('/crm/v3/objects/contacts');

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

Deploy it:
```bash
supabase functions deploy my-endpoint
```

### Getting Portal ID from Request

If users install your app, extract portal ID from the context:

```typescript
// From HubSpot CRM card request
const portalId = req.headers.get('X-HubSpot-Portal-Id');

// Or from your own database/session
const portalId = await getUserPortalId(userId);
```

## 🏗️ Project Structure

```
├── supabase/
│   ├── functions/
│   │   ├── oauth-install/          # Start OAuth flow
│   │   │   └── index.ts
│   │   ├── oauth-callback/         # Handle OAuth redirect
│   │   │   └── index.ts
│   │   ├── oauth-refresh/          # Refresh expired tokens
│   │   │   └── index.ts
│   │   ├── example-api/            # Example authenticated call
│   │   │   └── index.ts
│   │   └── _shared/
│   │       └── hubspot-client.ts   # Reusable API client
│   ├── migrations/
│   │   └── 20250104000000_create_oauth_tables.sql
│   └── config.toml                 # Supabase configuration
├── .env.example                    # Environment variable template
├── package.json                    # Helper scripts
└── README.md                       # This file
```

## 🔒 Security Best Practices

✅ **Never commit secrets** - Use environment variables\
✅ **Service role key** - Only used in Edge Functions, never client-side\
✅ **RLS enabled** - Database access restricted to service role\
✅ **HTTPS only** - All OAuth redirects require HTTPS\
✅ **State parameter** - CSRF protection (enhance in production)\
✅ **Token rotation** - Tokens automatically refresh before expiration

## 🔧 Configuration

### Required Scopes

Default scopes in this template:
- `oauth` - Required for OAuth flow
- `crm.objects.contacts.read` - Read contacts
- `crm.objects.contacts.write` - Write contacts

**To add more scopes:**
1. Edit `supabase/functions/oauth-install/index.ts`
2. Update `SCOPES` array
3. Redeploy: `supabase functions deploy oauth-install`

### Customizing Redirect URL

If you need a custom success page after OAuth:

Edit `supabase/functions/oauth-callback/index.ts`:
```typescript
// Instead of returning HTML, redirect to your app
return new Response(null, {
  status: 302,
  headers: {
    'Location': `https://yourapp.com/oauth-success?portal_id=${portal_id}`
  }
});
```

## 📊 Database Schema

### `oauth_tokens` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| portal_id | INTEGER | HubSpot portal/account ID (unique) |
| access_token | TEXT | Current OAuth access token |
| refresh_token | TEXT | OAuth refresh token |
| expires_at | TIMESTAMP | When access token expires |
| scopes | TEXT[] | Array of granted scopes |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Indexes:**
- `portal_id` - Fast lookups by portal
- `expires_at` - Efficient token expiration queries

## 🧪 Testing

### Test OAuth Flow
```bash
# Open in browser
open "https://your-project-ref.supabase.co/functions/v1/oauth-install"
```

### Test API Call
```bash
curl "https://your-project-ref.supabase.co/functions/v1/example-api?portal_id=YOUR_PORTAL_ID"
```

### View Function Logs
```bash
supabase functions logs oauth-callback --tail
```

### Check Database
```bash
# View stored tokens
supabase db remote --table oauth_tokens
```

## 🐛 Troubleshooting

### "Missing authorization header" Error
**Solution:** Functions need `verify_jwt = false` in config.toml. Redeploy functions.

### "Failed to get account information"
**Solution:** Check that CLIENT_ID and CLIENT_SECRET are correct in Supabase secrets.

### "Unable to load app information"
**Solution:** Make sure you ran `hs project deploy` for your HubSpot app.

### Tokens not refreshing
**Solution:** Verify SUPABASE_SERVICE_ROLE_KEY is set correctly.

### CORS errors
**Solution:** Add OPTIONS handler in your function (see example-api for reference).

## 📚 Resources

- [HubSpot OAuth Documentation](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/oauth/working-with-oauth)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [HubSpot API Reference](https://developers.hubspot.com/docs/api/overview)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)

## 💡 Examples & Use Cases

### Multi-Tenant SaaS
Store tokens for multiple customers, each with their own portal_id.

### HubSpot Integrations
Build bidirectional syncs between HubSpot and other services.

### CRM Extensions
Create custom CRM cards and workflows with real-time data.

### Automated Workflows
Schedule jobs that interact with HubSpot APIs automatically.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## ⭐ Show Your Support

If this template helped you, please give it a star! ⭐

---

**Ready to deploy?** Follow the [Quick Start](#-quick-start-5-minutes) guide above! 🚀

