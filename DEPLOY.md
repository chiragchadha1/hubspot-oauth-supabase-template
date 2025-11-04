# 📦 Deployment Guide

Complete deployment instructions for the HubSpot OAuth Supabase Template.

## 🎯 Deployment Options

### Option 1: One-Click Deploy (Coming Soon)
Click the "Deploy to Supabase" button in the README.

### Option 2: Manual Deployment (Recommended)
Full control over your deployment. Follow this guide.

### Option 3: GitHub Actions (Advanced)
Automated deployment on every push. See [CI/CD section](#cicd-with-github-actions).

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Supabase account created
- [ ] HubSpot developer account created
- [ ] HubSpot app created (or ready to create)
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Node.js 16+ installed
- [ ] Git installed

---

## 🚀 Step-by-Step Deployment

### Step 1: Create Supabase Project

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   ```

2. **Click "New Project"**

3. **Fill in details:**
   - **Name:** `hubspot-oauth-backend` (or your choice)
   - **Database Password:** Generate a strong password
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free (or Pro if needed)

4. **Wait for project creation** (2-3 minutes)

5. **Note these values:**
   - **Project Reference ID** (in URL: `https://supabase.com/dashboard/project/[YOUR-REF]`)
   - **Project URL** (Settings → API → Project URL)
   - **Service Role Key** (Settings → API → service_role - click eye to reveal)
   - **Anon Key** (Settings → API → anon public)

### Step 2: Clone Template & Link Project

```bash
# Clone template
git clone https://github.com/yourusername/hubspot-oauth-supabase-template.git
cd hubspot-oauth-supabase-template

# Install dependencies (optional, for helper scripts)
npm install

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

When prompted, enter your database password.

### Step 3: Create HubSpot App

#### Option A: New HubSpot Project App

1. **Install HubSpot CLI:**
   ```bash
   npm install -g @hubspot/cli
   ```

2. **Authenticate:**
   ```bash
   hs auth
   ```

3. **Create project:** (or use existing)
   ```bash
   hs project create
   ```

4. **Upload and deploy:**
   ```bash
   hs project upload
   hs project deploy
   ```

5. **Get credentials:**
   ```bash
   hs project open
   ```
   - Click your app → **Auth** tab
   - Copy **Client ID** and **Client Secret**

#### Option B: Legacy HubSpot App

1. Go to https://developers.hubspot.com/
2. Click **Apps** → **Create app**
3. Fill in app details
4. Go to **Auth** tab
5. Copy **Client ID** and **Client Secret**

### Step 4: Configure HubSpot Redirect URL

In your HubSpot app's **Auth** settings:

**Set Redirect URL to:**
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/oauth-callback
```

**Example:**
```
https://abcdefghijklmnop.supabase.co/functions/v1/oauth-callback
```

⚠️ **Must be EXACT** - trailing slashes matter!

### Step 5: Deploy Database Schema

```bash
# Push migrations to create oauth_tokens table
supabase db push
```

**Verify it worked:**
```bash
# Check migrations status
supabase migration list
```

You should see: `20250104000000_create_oauth_tables.sql` with status ✅

**Or check in dashboard:**
- Go to Table Editor
- You should see `oauth_tokens` table

### Step 6: Set Environment Variables

#### Option A: Using CLI (Recommended)

```bash
# Set all secrets at once
supabase secrets set \
  HUBSPOT_CLIENT_ID="your-client-id-here" \
  HUBSPOT_CLIENT_SECRET="your-client-secret-here" \
  HUBSPOT_REDIRECT_URI="https://YOUR_PROJECT_REF.supabase.co/functions/v1/oauth-callback" \
  SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

#### Option B: Using Dashboard

1. Go to: `https://supabase.com/dashboard/project/YOUR_REF/settings/functions`
2. Click **"Manage secrets"**
3. Add each variable:

| Variable Name | Where to Get It | Example |
|--------------|-----------------|---------|
| `HUBSPOT_CLIENT_ID` | HubSpot App → Auth tab | `3d4600f1-86e6-46c2-81d3...` |
| `HUBSPOT_CLIENT_SECRET` | HubSpot App → Auth tab (click eye) | `7c3ce02c-0f0c-4c9f-9700...` |
| `HUBSPOT_REDIRECT_URI` | Your Supabase function URL | `https://xxx.supabase.co/functions/v1/oauth-callback` |
| `SUPABASE_URL` | Settings → API → Project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role | `eyJhbGciOiJIUzI1NiIsInR5c...` |

**Verify secrets were set:**
```bash
supabase secrets list
```

### Step 7: Deploy Edge Functions

Deploy all functions:

```bash
# Deploy all at once
npm run deploy:functions

# OR deploy individually
supabase functions deploy oauth-install
supabase functions deploy oauth-callback
supabase functions deploy oauth-refresh
supabase functions deploy example-api
```

**Expected output:**
```
✓ Deployed oauth-install (version: xxx)
✓ Deployed oauth-callback (version: xxx)
✓ Deployed oauth-refresh (version: xxx)
✓ Deployed example-api (version: xxx)
```

**Verify deployment:**
```bash
# List deployed functions
supabase functions list
```

### Step 8: Test Your Deployment! 🎉

#### Test 1: OAuth Installation Flow

**Open in browser:**
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/oauth-install
```

**Expected behavior:**
1. ✅ Redirects to HubSpot authorization page
2. ✅ Shows your app name and requested scopes
3. ✅ After clicking "Connect app", redirects to callback
4. ✅ Shows success page with Portal ID

#### Test 2: Check Database

**Go to Supabase Dashboard:**
```
https://supabase.com/dashboard/project/YOUR_REF/editor
```

**Click `oauth_tokens` table** - you should see:
- Row with your `portal_id`
- `access_token` and `refresh_token` populated
- `expires_at` timestamp (~30 min in future)

#### Test 3: API Call

```bash
# Replace with your portal_id from database
curl "https://YOUR_PROJECT_REF.supabase.co/functions/v1/example-api?portal_id=YOUR_PORTAL_ID"
```

**Expected:** JSON response with your first 10 HubSpot contacts

#### Test 4: Check Logs

```bash
# View recent logs
supabase functions logs oauth-callback

# Tail logs in real-time
supabase functions logs oauth-callback --tail
```

---

## 🔄 Updating Your Deployment

### Update Functions

```bash
# After making code changes
supabase functions deploy oauth-callback

# Or redeploy all
npm run deploy:functions
```

### Update Database Schema

```bash
# Create new migration
supabase migration new add_new_column

# Edit the migration file in supabase/migrations/

# Apply migration
supabase db push
```

### Update Environment Variables

```bash
# Update a secret
supabase secrets set HUBSPOT_CLIENT_SECRET="new-secret"

# After updating secrets, redeploy functions
supabase functions deploy oauth-callback
```

---

## 🌍 Production Deployment

### Use Custom Domain (Optional)

1. **Set up custom domain in Supabase:**
   - Settings → General → Custom Domains
   - Add your domain (e.g., `api.yourdomain.com`)
   - Update DNS records

2. **Update HubSpot redirect URL:**
   ```
   https://api.yourdomain.com/functions/v1/oauth-callback
   ```

3. **Update environment variables:**
   ```bash
   supabase secrets set HUBSPOT_REDIRECT_URI="https://api.yourdomain.com/functions/v1/oauth-callback"
   supabase secrets set SUPABASE_URL="https://api.yourdomain.com"
   ```

### Enable Production Features

1. **Set up monitoring:**
   - Supabase Dashboard → Logs
   - Set up alerts for errors

2. **Enable database backups:**
   - Settings → Database → Backup settings
   - Enable point-in-time recovery (Pro plan)

3. **Review security:**
   - Audit RLS policies
   - Rotate secrets regularly
   - Enable 2FA on Supabase account

---

## 🤖 CI/CD with GitHub Actions

### Automatic Deployment on Push

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Supabase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Deploy Functions
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase functions deploy oauth-install
          supabase functions deploy oauth-callback
          supabase functions deploy oauth-refresh
          supabase functions deploy example-api
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```

**Set GitHub Secrets:**
- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN` (generate from Supabase dashboard)
- `SUPABASE_DB_PASSWORD`

---

## 🐛 Troubleshooting Deployment

### Functions Won't Deploy

**Error:** `Invalid config`
```bash
# Validate config
supabase functions list --debug
```

**Error:** `Authentication failed`
```bash
# Re-login
supabase login
supabase link --project-ref YOUR_REF
```

### Database Migration Fails

```bash
# Check migration status
supabase migration list

# Reset if needed (WARNING: deletes data)
supabase db reset

# Or repair
supabase migration repair --status applied 20250104000000
```

### OAuth Flow Not Working

1. **Check redirect URL matches exactly:**
   ```bash
   # In HubSpot dashboard
   # In Supabase secrets
   supabase secrets list
   ```

2. **View function logs:**
   ```bash
   supabase functions logs oauth-callback --tail
   ```

3. **Test function directly:**
   ```bash
   curl https://YOUR_REF.supabase.co/functions/v1/oauth-install
   ```

### Tokens Not Storing

1. **Check service role key is correct:**
   ```bash
   supabase secrets list
   ```

2. **Verify table exists:**
   ```bash
   supabase db remote --table oauth_tokens
   ```

3. **Check RLS policies:**
   - Dashboard → Table Editor → oauth_tokens → Policies

---

## 📊 Post-Deployment Checklist

- [ ] OAuth flow works end-to-end
- [ ] Tokens stored in database
- [ ] Example API call returns data
- [ ] Function logs are clean (no errors)
- [ ] All secrets configured correctly
- [ ] HubSpot redirect URL matches
- [ ] Database table created successfully
- [ ] Monitoring/alerts set up (production)

---

## 🎓 Next Steps

After successful deployment:

1. **Customize for your use case** - Edit functions to add your logic
2. **Add more endpoints** - Create new functions for your features
3. **Set up monitoring** - Configure alerts and logging
4. **Scale as needed** - Upgrade Supabase plan if required
5. **Share your template** - Help others by sharing improvements!

---

## 💬 Get Help

- 📖 [Supabase Docs](https://supabase.com/docs)
- 📖 [HubSpot Docs](https://developers.hubspot.com/docs)
- 💬 [Supabase Discord](https://discord.supabase.com)
- 💬 [HubSpot Community](https://community.hubspot.com)

---

**Deployment successful?** Give the repo a star! ⭐

