# Testing with HubSpot Signatures

To test that signature validation is working correctly, you need to call your endpoint from HubSpot (where signatures are automatically included).

## Method 1: Create a Test Serverless Function in Your HubSpot Project

### 1. Create Test Function

In your HubSpot project, create a new serverless function:

```bash
# In your HubSpot project directory
hs create function
# Name: test-signature
# Endpoint: /test-signature
# Method: GET
```

### 2. Add Test Code

Edit `src/app/app.functions/test-signature.js`:

```javascript
const axios = require('axios');

exports.main = async (context = {}) => {
  const { portal_id } = context.account;

  // Your Supabase backend URL
  const BACKEND_URL = 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/example-api';

  console.log(`Testing signature validation for portal ${portal_id}`);

  try {
    const response = await axios.get(`${BACKEND_URL}?portal_id=${portal_id}`);

    return {
      statusCode: 200,
      body: {
        success: true,
        message: '✅ Signature validation passed!',
        portal_id: portal_id,
        contacts: response.data.contacts,
        backend_response: response.data
      }
    };
  } catch (error) {
    console.error('Error calling backend:', error.response?.data || error.message);

    return {
      statusCode: error.response?.status || 500,
      body: {
        success: false,
        message: '❌ Request failed',
        error: error.response?.data || error.message,
        note: 'If you see "HubSpot signature required" or "Invalid signature", check your HUBSPOT_CLIENT_SECRET matches between HubSpot and Supabase'
      }
    };
  }
};
```

### 3. Deploy and Test

```bash
# Deploy your HubSpot project
hs project upload

# Test the function
curl "https://YOUR-HUBSPOT-APP-ID.hs-sites.com/_hcms/api/test-signature"
```

**Expected response with signature validation enabled:**
```json
{
  "success": true,
  "message": "✅ Signature validation passed!",
  "contacts": [...]
}
```

### 4. Check Logs

**Supabase logs (should show valid signature):**
```bash
supabase functions logs example-api --tail
```

You should see:
```
✅ Valid HubSpot signature (v3)
```

## Method 2: Test with a Custom Card

If you have a custom card in your HubSpot project, you can test from there:

```javascript
// In your card's React component or data fetch
import axios from 'axios';

const TestSignature = () => {
  const testAPI = async () => {
    const portalId = context.portal.id;
    const response = await axios.get(
      `https://YOUR-PROJECT-REF.supabase.co/functions/v1/example-api?portal_id=${portalId}`
    );
    console.log('Response:', response.data);
  };

  return <button onClick={testAPI}>Test Signature Validation</button>;
};
```

## Method 3: Test with Workflow Actions

Create a custom workflow action that calls your endpoint:

1. Add `workflow-action` feature to your HubSpot project
2. In your workflow action code, call the Supabase endpoint
3. Trigger the workflow
4. Check logs to see signature validation

## Verify Signature Validation is Working

### Test 1: Call FROM HubSpot (should succeed)
```bash
# Call your test function that calls the backend
curl "https://YOUR-HUBSPOT-APP-ID.hs-sites.com/_hcms/api/test-signature"
```
**Expected:** ✅ Success with contacts data

### Test 2: Call Directly from curl (should fail)
```bash
# Direct call without HubSpot signatures
curl "https://YOUR-PROJECT-REF.supabase.co/functions/v1/example-api?portal_id=YOUR_PORTAL_ID"
```
**Expected:** ❌ 401 error: "HubSpot signature required"

### Test 3: Check Supabase Logs
```bash
supabase functions logs example-api --tail
```

**When called FROM HubSpot:**
```
✅ Valid HubSpot signature (v3)
```

**When called directly (curl/Postman):**
```
❌ No HubSpot signature found - request rejected
```

## Troubleshooting

### Error: "HubSpot signature required"
**From HubSpot function:** Your `HUBSPOT_CLIENT_SECRET` in Supabase doesn't match the one in HubSpot.

**Fix:**
```bash
# Make sure these match exactly
# HubSpot: developers.hubspot.com → Your App → Auth tab → Client Secret
# Supabase:
supabase secrets set HUBSPOT_CLIENT_SECRET="your-exact-client-secret"
supabase functions deploy example-api
```

### Error: "Invalid HubSpot signature"
The secret is set but doesn't match. Double-check:
1. No extra spaces in the secret
2. Using the correct Client Secret from HubSpot developers dashboard
3. The secret is the same in both platforms

### Signature validation is bypassed
Check your environment variable:
```bash
# Should be "true" or not set at all for production
supabase secrets list | grep REQUIRE_HUBSPOT_SIGNATURE

# If it's "false", re-enable it:
supabase secrets set REQUIRE_HUBSPOT_SIGNATURE="true"
supabase functions deploy example-api
```

## Understanding the Headers

When HubSpot calls your endpoint, it automatically includes:

**v3 (most common):**
```
X-HubSpot-Signature-V3: base64-encoded-signature
X-HubSpot-Request-Timestamp: 1234567890
```

**v2:**
```
X-HubSpot-Signature: hex-encoded-signature
X-HubSpot-Signature-Version: v2
```

**v1 (legacy):**
```
X-HubSpot-Signature: hex-encoded-signature
X-HubSpot-Signature-Version: v1
```

You can see these headers in your Supabase function logs by adding:
```typescript
// In example-api/index.ts (temporarily for debugging)
console.log('Headers:', Object.fromEntries(req.headers.entries()));
```

## Complete Testing Workflow

1. ✅ **Enable signature validation** (default)
   ```bash
   # Make sure it's enabled or not set
   supabase secrets list
   ```

2. ✅ **Create test function in HubSpot** (see Method 1 above)

3. ✅ **Call from HubSpot** → Should succeed
   ```bash
   curl "https://YOUR-APP.hs-sites.com/_hcms/api/test-signature"
   ```

4. ✅ **Call directly** → Should fail with 401
   ```bash
   curl "https://YOUR-PROJECT-REF.supabase.co/functions/v1/example-api?portal_id=123"
   ```

5. ✅ **Check logs** → Should show signature validation
   ```bash
   supabase functions logs example-api --tail
   ```

This confirms your signature validation is working correctly! 🔒

