# Testing Guide

## Quick Start: Test with Postman/curl

### 1. Complete OAuth Flow First
Before testing the API, you need to get OAuth tokens stored:

```bash
# Open this URL in your browser
https://your-project-ref.supabase.co/functions/v1/oauth-install
```

After successful OAuth, note your **Portal ID** from the success page.

### 2. Enable Dev Mode (Disable Signature Validation)

**Why?** By default, the API only accepts requests from HubSpot with valid signatures. Postman/curl don't have HubSpot signatures, so they'll be rejected with 401 errors.

```bash
# Login to Supabase CLI
supabase login

# Disable signature validation for testing
supabase secrets set REQUIRE_HUBSPOT_SIGNATURE="false"

# Redeploy the function
supabase functions deploy example-api
```

**Security Note:** This disables security checks. Only use for development/testing. Always re-enable before deploying to production!

### 3. Test with curl

```bash
# Replace YOUR_PORTAL_ID with the actual portal ID from step 1
curl "https://your-project-ref.supabase.co/functions/v1/example-api?portal_id=YOUR_PORTAL_ID"
```

**Expected response:**
```json
{
  "success": true,
  "portal_id": 12345678,
  "contacts": [...]
}
```

### 4. Test with Postman

**Request:**
- Method: `GET`
- URL: `https://your-project-ref.supabase.co/functions/v1/example-api?portal_id=YOUR_PORTAL_ID`
- Headers: None needed in dev mode
- Body: None

**Expected response:** Same as curl above

### 5. Re-enable Security for Production

```bash
# Re-enable signature validation
supabase secrets set REQUIRE_HUBSPOT_SIGNATURE="true"

# Redeploy
supabase functions deploy example-api
```

## Troubleshooting

### Error: "No OAuth tokens found for this portal"

**Cause:** You haven't completed the OAuth flow yet, or you're using the wrong portal_id.

**Fix:**
1. Go to: `https://your-project-ref.supabase.co/functions/v1/oauth-install`
2. Complete the OAuth authorization
3. Note the portal_id from the success page
4. Use that portal_id in your API calls

### Error: "HubSpot signature required" or "Invalid HubSpot signature"

**Cause:** Signature validation is enabled, and your request (from Postman/curl) doesn't have valid HubSpot signatures.

**Fix:**
```bash
# Disable signature validation for testing
supabase secrets set REQUIRE_HUBSPOT_SIGNATURE="false"
supabase functions deploy example-api

# Test your request
curl "https://your-project-ref.supabase.co/functions/v1/example-api?portal_id=YOUR_ID"

# Re-enable for production
supabase secrets set REQUIRE_HUBSPOT_SIGNATURE="true"
supabase functions deploy example-api
```

**Note:** Direct requests from Postman/curl will never have valid HubSpot signatures. Only requests originating from HubSpot (serverless functions, workflows, webhooks) include these signatures.

### Error: "Valid portal_id is required"

**Cause:** Missing or invalid portal_id parameter.

**Fix:**
Add `?portal_id=YOUR_PORTAL_ID` to the URL. Must be a valid number.

## Production Testing (from HubSpot)

When testing in production with signature validation enabled:

```javascript
// In your HubSpot serverless function
exports.main = async (context) => {
  const { portal_id } = context.account;

  const response = await fetch(
    `https://your-project-ref.supabase.co/functions/v1/example-api?portal_id=${portal_id}`
  );

  const data = await response.json();
  console.log('Contacts:', data.contacts);

  return data;
};
```

HubSpot automatically includes signature headers, so the request will be validated and accepted.

## View Logs

```bash
# Watch logs in real-time
supabase functions logs example-api --tail

# View logs from specific time
supabase functions logs example-api
```

Look for:
- `✅ Valid HubSpot signature (v3)` - Request from HubSpot validated
- `⚠️ Signature validation DISABLED` - Dev mode active
- `⚠️ No HubSpot signature found` - Direct curl/Postman request

