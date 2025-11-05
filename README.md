# 🚀 HubSpot OAuth Backend Template for Supabase

A complete, production-ready OAuth 2.0 backend for HubSpot apps built on Supabase. Deploy in minutes with automatic token refresh, secure storage, and a ready-to-use API client.

Based on the [HubSpot OAuth Quickstart](https://github.com/HubSpot/oauth-quickstart-nodejs) flow, but optimized for Supabase Edge Functions.

[Deploy with Supabase](https://supabase.com/dashboard/new)

## ✨ Features

- ✅ **Complete OAuth 2.0 Flow** - Handle HubSpot authorization seamlessly
- ✅ **Automatic Token Refresh** - Never worry about expired tokens
- ✅ **Secure PostgreSQL Storage** - Encrypted token storage with RLS
- ✅ **Edge Functions** - Fast, globally distributed serverless functions
- ✅ **TypeScript Ready** - Fully typed API client included
- ✅ **Production Ready** - Error handling, logging, and best practices built-in
- ✅ **Self-Documenting** - Success page teaches users how to customize it
- ✅ **100% Free Tier Compatible** - Works perfectly on Supabase free plan

## 🏗️ Architecture

This is an **OAuth backend** that handles authentication and token management for your HubSpot app. It works alongside your HubSpot project:

```
┌─────────────────────┐         ┌──────────────────────┐
│  HubSpot Project    │         │  OAuth Backend       │
│  (hs project)       │◄────────│  (This repo)         │
├─────────────────────┤         ├──────────────────────┤
│ • App metadata      │         │ • Token exchange     │
│ • UI extensions     │         │ • Token storage      │
│ • Serverless fns    │         │ • Token refresh      │
│ • Cards, workflows  │         │ • API wrapper        │
│ • Redirect URI      │         │ • Database           │
└─────────────────────┘         └──────────────────────┘
        ↓                                ↑
        └────── OAuth flow ──────────────┘
```

**Your HubSpot Project** (`hs project create`):
- Defines your app in `app.hsmeta.json`
- Contains UI extensions, cards, serverless functions
- **Sets the redirect URI** that points to this backend
- Deployed to HubSpot's platform

**This OAuth Backend** (Supabase):
- Handles OAuth callbacks from HubSpot
- Exchanges authorization codes for tokens
- Stores and refreshes tokens automatically
- Provides `HubSpotClient` for making API calls

## 🎯 What's Included

### Database
- `oauth_tokens` table with automatic timestamps and indexes
- Row-level security (RLS) policies
- Optimized for token lookups and expiration management

### Edge Functions
- **oauth-install** - Initiates OAuth flow, redirects to HubSpot
- **oauth-callback** - Handles redirect, exchanges code for tokens, shows simple success message
- **index** - Returns portal info and contact data as JSON
- **oauth-refresh** - Automatically refreshes expired tokens
- **example-api** - Demonstrates authenticated HubSpot API calls

### Utilities
- **HubSpotClient** - Reusable client with automatic token refresh
- Pre-configured CORS and error handling
- Comprehensive logging for debugging

## 🔄 OAuth Flow (Simplified)

1. **User visits `/oauth-install`** → Redirects to HubSpot authorization page
2. **User authorizes app** → HubSpot redirects to `/oauth-callback` with code
3. **App exchanges code for tokens** → Stores in database
4. **Shows success message** → User can close the page
5. **All API calls auto-refresh tokens** → Never worry about expired tokens

## 🚀 Quick Start

### Prerequisites
- [Supabase account](https://supabase.com) (free)
- [HubSpot developer account](https://developers.hubspot.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### 1. Clone & Link

```bash
git clone https://github.com/yourusername/hubspot-oauth-supabase-template.git
cd hubspot-oauth-supabase-template
supabase login
supabase link
```

### 2. Deploy Database

```bash
supabase db push
```

### 3. Create HubSpot Project

Create your HubSpot app project:

```bash
# Install HubSpot CLI
npm install -g @hubspot/cli

# Create project
hs project create

# Select your options:
# - Project base: app
# - Features: (choose what you need)
# - Auth: oauth (required for this backend)
# - Distribution: private or marketplace
```

This creates your HubSpot project with an `app.hsmeta.json` file.

### 4. Configure Redirect URI

In your HubSpot project's `app.hsmeta.json`, set the redirect URI:

```json
{
  "name": "Your App Name",
  "auth": {
    "redirectUrls": [
      "https://your-project-ref.supabase.co/functions/v1/oauth-callback"
    ]
  }
}
```

Deploy your HubSpot project:
```bash
hs project upload
```

> **Note:** The redirect URI must be set in your HubSpot project's metadata file and deployed to HubSpot. You cannot change it in the HubSpot UI after creation - it must be updated in the file and re-deployed.

### 5. Get App Credentials

After deploying your HubSpot project:
1. Visit [developers.hubspot.com](https://developers.hubspot.com)
2. Find your app and go to the **Auth** tab
3. Copy your **Client ID** and **Client Secret**

### 6. Set Backend Secrets

Via CLI or Dashboard (Edge Functions → Secrets):

```bash
supabase secrets set HUBSPOT_CLIENT_ID="your-client-id"
supabase secrets set HUBSPOT_CLIENT_SECRET="your-client-secret"
supabase secrets set HUBSPOT_REDIRECT_URI="https://your-project-ref.supabase.co/functions/v1/oauth-callback"
```

> **Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically set by Supabase.

### 7. Deploy Functions

```bash
supabase functions deploy
```

### 8. Test! 🎉

Visit: `https://your-project-ref.supabase.co/functions/v1/oauth-install`

You'll see a self-documenting success page with your Portal ID, scopes, and customization instructions.

## 🔄 How It Works

1. **User installs your app** → Redirected to HubSpot OAuth page
2. **User authorizes** → HubSpot redirects to your Supabase callback URL
3. **Backend exchanges code for tokens** → Stores in database
4. **Your HubSpot project uses tokens** → Makes API calls via this backend

Your HubSpot project (cards, workflows, functions) can call the `example-api` endpoint with a `portal_id` to make authenticated requests to HubSpot APIs. The tokens are automatically refreshed when needed.

Based on the [HubSpot OAuth Quickstart](https://github.com/HubSpot/oauth-quickstart-nodejs).

## 📖 Usage

### From Your HubSpot Project

Call the example API from your HubSpot serverless functions or UI extensions:

```javascript
// In your HubSpot project's serverless function
const response = await fetch(
  'https://your-project-ref.supabase.co/functions/v1/example-api?portal_id=' + portalId
);
const data = await response.json();
```

### From This Backend (Custom Endpoints)

Create custom Edge Functions that use the `HubSpotClient`:

```typescript
import { HubSpotClient } from '../_shared/hubspot-client.ts';

const hubspot = new HubSpotClient({
  supabaseUrl: Deno.env.get('SUPABASE_URL')!,
  supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  portalId: YOUR_PORTAL_ID,
});

// Tokens refresh automatically!
const contacts = await hubspot.get('/crm/v3/objects/contacts');
await hubspot.post('/crm/v3/objects/contacts', { properties: {...} });
await hubspot.patch('/crm/v3/objects/contacts/123', { properties: {...} });
await hubspot.delete('/crm/v3/objects/contacts/123');
```

See `example-api/index.ts` for a full working example.

## 🏗️ Project Structure

```
├── supabase/
│   ├── functions/
│   │   ├── oauth-install/          # Start OAuth flow
│   │   │   └── index.ts
│   │   ├── oauth-callback/         # Handle OAuth redirect, show success
│   │   │   └── index.ts
│   │   ├── index/                  # Returns portal info as JSON
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

### Function Flow

```
┌─────────────┐
│ oauth-      │  1. User clicks "Install"
│ install     ├──────────────────────────────────┐
└─────────────┘                                  │
                                                 ▼
                                          ┌─────────────┐
                                          │  HubSpot    │
                                          │  OAuth      │
                                          │  Page       │
                                          └──────┬──────┘
                                                 │ 2. User authorizes
                                                 ▼
                                          ┌─────────────┐
                                          │ oauth-      │  3. Exchanges code
                                          │ callback    │     for tokens
                                          └──────┬──────┘
                                                 │ 4. Shows success
                                                 ▼
                                          ┌─────────────┐
                                          │ ✅ Success! │
                                          │ Close page  │
                                          └─────────────┘

┌─────────────┐
│ index       │  (Optional) Query portal info as JSON
└─────────────┘

┌─────────────┐
│ example-api │  Use anytime to call HubSpot APIs
└─────────────┘  (tokens auto-refresh!)
```

## 🔒 Security Best Practices

✅ **Never commit secrets** - Use environment variables\
✅ **Service role key** - Only used in Edge Functions, never client-side\
✅ **RLS enabled** - Database access restricted to service role\
✅ **HTTPS only** - All OAuth redirects require HTTPS\
✅ **State parameter** - CSRF protection (enhance in production)\
✅ **Token rotation** - Tokens automatically refresh before expiration

## 🔧 Configuration

### Add More Scopes

Edit `oauth-install/index.ts`, update `SCOPES` array, then redeploy.

### Customize Success Page

The success page shows users how to customize it. Options include:
- Edit the message in `oauth-callback/index.ts`
- Redirect to your app
- Create a custom HTML page
- Use a custom domain (Supabase Pro)

## 📊 Database

The `oauth_tokens` table stores access/refresh tokens with automatic timestamps and indexes on `portal_id` and `expires_at`.

## 🧪 Testing

```bash
# Test OAuth
open "https://your-project-ref.supabase.co/functions/v1/oauth-install"

# Test API
curl "https://your-project-ref.supabase.co/functions/v1/example-api?portal_id=PORTAL_ID"

# View logs
supabase functions logs oauth-callback
```

## 🐛 Troubleshooting

**Missing authorization header:** Ensure `verify_jwt = false` in `config.toml`

**Failed to get account information:** Check your HubSpot Client ID/Secret

**Tokens not refreshing:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-set by Supabase

**CORS errors:** See `example-api/index.ts` for OPTIONS handler example

## 📚 Resources

- [HubSpot OAuth Quickstart](https://github.com/HubSpot/oauth-quickstart-nodejs)
- [HubSpot Project CLI Docs](https://developers.hubspot.com/docs/platform/projects)
- [HubSpot API Docs](https://developers.hubspot.com/docs/api/overview)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## 💡 Common Use Cases

**Multi-tenant SaaS:** Store tokens for multiple customers, each with their own `portal_id`. Your HubSpot project calls this backend to access customer data.

**Custom CRM Cards:** Your HubSpot project displays custom cards that fetch data via this backend's authenticated API calls.

**Workflow Actions:** Custom workflow actions in your HubSpot project use this backend to perform authenticated operations.

**Scheduled Jobs:** Edge Functions can run on schedules (via cron) to sync data between HubSpot and other services.

---

**Built with ❤️ for the HubSpot developer community**

