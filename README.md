# 🚀 HubSpot OAuth Backend Template for Supabase

A complete, production-ready OAuth 2.0 backend for HubSpot apps built on Supabase Edge Functions. Deploy in minutes with automatic token refresh, secure storage, and HubSpot signature validation.

## ✨ Features

- ✅ **Complete OAuth 2.0 Flow** - Handle HubSpot authorization seamlessly
- ✅ **Automatic Token Refresh** - Never worry about expired tokens
- ✅ **Secure PostgreSQL Storage** - Encrypted token storage with RLS policies
- ✅ **HubSpot Signature Validation** - Support for v3, v2, and v1 signatures
- ✅ **Edge Functions** - Fast, globally distributed serverless functions
- ✅ **TypeScript Ready** - Fully typed with comprehensive JSDoc comments
- ✅ **Production Ready** - Error handling, logging, and best practices built-in

## 📁 What's Included

### Edge Functions
- **oauth-install** - Initiates OAuth flow and redirects to HubSpot
- **oauth-callback** - Handles OAuth callback and stores tokens
- **oauth-refresh** - Manual token refresh endpoint (optional)
- **example-api** - Example authenticated API call with signature validation

### Utilities
- **HubSpotClient** - Reusable API client with automatic token management
- **validateHubSpotSignature** - Request signature validation (v3, v2, v1)

### Database
- **oauth_tokens** table with RLS policies for secure token storage

## 🚀 Quick Start

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Note your **Project URL** and **Service Role Key** (Settings → API)

### 2. Clone and Link

```bash
git clone <your-repo-url>
cd oauth-supabase-be

# Install Supabase CLI if needed
npm install -g supabase

# Login and link to your project
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Deploy Database

```bash
supabase db push
```

### 4. Create HubSpot App

#### Option A: New Project App (Recommended)
```bash
npm install -g @hubspot/cli
hs auth
hs project create
```

#### Option B: Legacy App
1. Go to [HubSpot Developers](https://developers.hubspot.com)
2. Click **Apps** → **Create app**
3. Go to **Auth** tab to get credentials

### 5. Configure Environment Variables

```bash
supabase secrets set \
  HUBSPOT_CLIENT_ID="your-client-id" \
  HUBSPOT_CLIENT_SECRET="your-client-secret" \
  HUBSPOT_REDIRECT_URI="https://YOUR_PROJECT_REF.supabase.co/functions/v1/oauth-callback" \
  SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 6. Set Redirect URL in HubSpot

In your HubSpot app's **Auth** settings, set:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/oauth-callback
```

### 7. Deploy Functions

```bash
supabase functions deploy oauth-install
supabase functions deploy oauth-callback
supabase functions deploy oauth-refresh
supabase functions deploy example-api
```

### 8. Test OAuth Flow

Open in browser:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/oauth-install
```

After authorization, tokens will be stored in your database!

## 💻 Usage Examples

### Making Authenticated API Calls

```typescript
import { HubSpotClient } from '../_shared/hubspot-client.ts';

const hubspot = new HubSpotClient({
  supabaseUrl: Deno.env.get('SUPABASE_URL')!,
  supabaseKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  portalId: 12345,
});

// Get contacts (tokens auto-refresh if needed)
const contacts = await hubspot.get('/crm/v3/objects/contacts?limit=10');

// Create contact
await hubspot.post('/crm/v3/objects/contacts', {
  properties: {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com'
  }
});

// Update contact
await hubspot.patch('/crm/v3/objects/contacts/123', {
  properties: { phone: '555-1234' }
});
```

### Using from HubSpot UI Extensions

```typescript
// In your HubSpot card or extension
import { hubspot } from '@hubspot/ui-extensions';

const response = await hubspot.fetch(
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/example-api',
  { method: 'GET' }
);

const data = await response.json();
// HubSpot automatically includes signatures and portalId
```

## 🔐 Signature Validation

This template validates HubSpot request signatures to ensure requests are authentic.

### Supported Versions
- **v3** (HMAC-SHA256 + timestamp) - Used by UI Extensions, latest webhooks
- **v2** (SHA-256) - Used by workflow actions, CRM cards
- **v1** (SHA-256, legacy) - Used by older webhooks

### Testing with Signature Validation

**For development/testing:**
```bash
# Disable signature validation
supabase secrets set REQUIRE_HUBSPOT_SIGNATURE="false"
supabase functions deploy example-api

# Now you can test with curl/Postman
curl "https://YOUR_REF.supabase.co/functions/v1/example-api?portalId=12345"

# Re-enable for production
supabase secrets set REQUIRE_HUBSPOT_SIGNATURE="true"
```

**For production:** Keep signature validation enabled. Only requests from HubSpot with valid signatures will be accepted.

## 🧪 Testing

### Test OAuth Flow
1. Visit: `https://YOUR_REF.supabase.co/functions/v1/oauth-install`
2. Authorize your HubSpot account
3. Check database for stored tokens

### Test API Endpoint

**With validation disabled (dev mode):**
```bash
curl "https://YOUR_REF.supabase.co/functions/v1/example-api?portalId=YOUR_PORTAL_ID"
```

**From HubSpot (production):**
```javascript
// HubSpot automatically adds signatures
hubspot.fetch('https://YOUR_REF.supabase.co/functions/v1/example-api')
```

### View Logs

**In Supabase Dashboard:**
1. Go to your project: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
2. Navigate to **Edge Functions** in the sidebar
3. Click on a function (e.g., `example-api`)
4. Click the **Logs** tab to view real-time logs
5. Use filters to search by time range, status, or content

**View recent logs via CLI:**
```bash
# View recent logs (not real-time)
supabase functions logs example-api
```

> **Note:** Real-time log tailing (`--tail`) only works with locally running functions via `supabase functions serve`. For deployed functions, use the Supabase Dashboard for real-time monitoring.

## 📂 Project Structure

```
oauth-supabase-be/
├── supabase/
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── hubspot-client.ts       # API client with auto-refresh
│   │   │   └── hubspot-signature.ts    # Signature validation
│   │   ├── oauth-install/
│   │   │   └── index.ts                # Start OAuth flow
│   │   ├── oauth-callback/
│   │   │   └── index.ts                # Handle OAuth callback
│   │   ├── oauth-refresh/
│   │   │   └── index.ts                # Manual token refresh
│   │   ├── example-api/
│   │   │   └── index.ts                # Example authenticated endpoint
│   │   └── deno.json                   # Deno configuration
│   ├── migrations/
│   │   └── 20250104000000_create_oauth_tables.sql
│   └── config.toml
├── package.json
├── LICENSE
└── README.md
```

## 🔄 How Token Refresh Works

The `HubSpotClient` automatically handles token refresh:

1. Before each API call, checks if token is expired
2. If expired, refreshes token with HubSpot OAuth API
3. Updates database with new tokens
4. Retries the original request with fresh token
5. All happens transparently - you never need to worry about it!

## 🌍 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `HUBSPOT_CLIENT_ID` | Your HubSpot app's client ID | `3d4600f1-86e6...` |
| `HUBSPOT_CLIENT_SECRET` | Your HubSpot app's client secret | `7c3ce02c-0f0c...` |
| `HUBSPOT_REDIRECT_URI` | OAuth callback URL | `https://xxx.supabase.co/functions/v1/oauth-callback` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from Supabase | `eyJhbGciOiJIUzI1NiI...` |
| `REQUIRE_HUBSPOT_SIGNATURE` | Enable signature validation (optional) | `true` or `false` |

## 🔒 Security

- ✅ Row-level security (RLS) on database tables
- ✅ Service role key for server-side operations only
- ✅ HubSpot signature validation (v3, v2, v1)
- ✅ Automatic token refresh prevents stale credentials
- ✅ HTTPS-only endpoints
- ✅ Environment-based configuration (no hardcoded secrets)

## 🚢 Deployment

### Update Functions
```bash
# Redeploy after changes
supabase functions deploy example-api
```

### Update Database
```bash
# Create new migration
supabase migration new add_column

# Apply migration
supabase db push
```

### Update Secrets
```bash
supabase secrets set KEY="value"
# Redeploy affected functions after updating secrets
```

## 🐛 Troubleshooting

### "No OAuth tokens found for this portal"
**Solution:** Complete the OAuth flow first:
1. Visit `/oauth-install`
2. Authorize the app
3. Use the portal_id from the success page

### "HubSpot signature required" (when testing with curl/Postman)
**Solution:** Disable signature validation for development:
```bash
supabase secrets set REQUIRE_HUBSPOT_SIGNATURE="false"
```

**For production testing:** Test your API directly from a HubSpot card or extension:
```typescript
// In your HubSpot card
import { hubspot } from '@hubspot/ui-extensions';

const response = await hubspot.fetch(
  `https://YOUR_REF.supabase.co/functions/v1/example-api?portalId=${portalId}`
);
const data = await response.json();
// HubSpot automatically includes signatures!
```

**Before publishing to production:**
```bash
# Re-enable signature validation
supabase secrets set REQUIRE_HUBSPOT_SIGNATURE="true"
```

> 🔒 **Security Best Practice:** Always enable signature validation (`REQUIRE_HUBSPOT_SIGNATURE="true"`) for production deployments. Only disable it temporarily for local testing with curl/Postman.

### OAuth callback fails
**Solution:** Verify redirect URI matches exactly:
- Check HubSpot app settings
- Check `HUBSPOT_REDIRECT_URI` environment variable
- Trailing slashes matter!

### Tokens not refreshing
**Solution:** Check that all environment variables are set correctly:
```bash
supabase secrets list
```

### Viewing Logs for Debugging
**Supabase Dashboard (Recommended):**
1. Go to: `https://supabase.com/dashboard/project/YOUR_REF/functions`
2. Click on the function you want to debug
3. View real-time logs with filters and search

**Check for common log messages:**
- ✅ `Valid HubSpot signature (v3)` - Request authenticated successfully
- ❌ `Invalid HubSpot signature` - Check your `HUBSPOT_CLIENT_SECRET`
- ⚠️ `Signature validation DISABLED` - Dev mode active (don't use in production!)

## 📚 Additional Resources

- [HubSpot OAuth Documentation](https://developers.hubspot.com/docs/api/oauth-quickstart-guide)
- [HubSpot API Reference](https://developers.hubspot.com/docs/api/overview)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [HubSpot Signature Validation](https://developers.hubspot.com/docs/api/webhooks/validating-requests)

## 🙏 Credits

Based on the [HubSpot OAuth Quickstart](https://github.com/HubSpot/oauth-quickstart-nodejs) pattern, adapted for Supabase Edge Functions with enhanced security features.

---

**Ready to deploy?** Give it a star! ⭐
