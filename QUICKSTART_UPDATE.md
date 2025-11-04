# 🔄 Update to HubSpot Quickstart Flow

This template has been updated to match the [HubSpot OAuth quickstart](https://github.com/HubSpot/oauth-quickstart-nodejs) flow exactly!

## What Changed?

### Before
After OAuth, you saw a static success page with just your Portal ID.

### After (Now!)
After OAuth, you're redirected to a **home page that displays actual contact data** from your HubSpot account - just like the quickstart!

## New Flow Diagram

```
1. Visit /oauth-install
        ↓
2. Authorize on HubSpot
        ↓
3. Callback exchanges code
        ↓
4. Redirect to /index (NEW!)
        ↓
5. Displays contact from HubSpot 🎉
```

## Deploying the Update

If you're updating an existing deployment:

```bash
# Deploy the new index function
supabase functions deploy index

# Re-deploy oauth-callback (updated to redirect to home)
supabase functions deploy oauth-callback
```

## Testing the New Flow

1. **Visit the install page:**
   ```
   https://your-project-ref.supabase.co/functions/v1/oauth-install
   ```

2. **Authorize your HubSpot account**

3. **You'll now be redirected to a beautiful home page showing:**
   - ✅ Your Portal ID
   - 📇 A contact from your HubSpot account
   - 🎯 Next steps with example API endpoint

## Files Changed

### New Files
- `supabase/functions/index/index.ts` - Home page that displays contact

### Updated Files
- `supabase/functions/oauth-callback/index.ts` - Now redirects to home instead of showing static HTML
- `README.md` - Updated with new flow documentation
- `EXAMPLES.md` - Added OAuth flow explanation

## Why This Update?

The original implementation showed a static success page. The HubSpot quickstart shows actual data after OAuth, which:
- ✅ Proves the OAuth flow works end-to-end
- ✅ Demonstrates making authenticated API calls
- ✅ Provides a better user experience
- ✅ Matches the official HubSpot pattern

## Troubleshooting

### "No contacts found" message?
Your HubSpot portal doesn't have any contacts yet. Create one in HubSpot or the home page will show a friendly message.

### Still seeing the old success page?
Make sure you deployed both functions:
```bash
supabase functions deploy oauth-callback
supabase functions deploy index
```

### Errors when fetching contact?
Check the function logs:
```bash
supabase functions logs index --tail
```

---

**Questions?** Compare with the [HubSpot OAuth quickstart](https://github.com/HubSpot/oauth-quickstart-nodejs) for reference.

