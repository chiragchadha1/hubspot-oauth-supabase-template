# Contributing to HubSpot OAuth Supabase Template

Thank you for considering contributing! 🎉

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## 📋 Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/hubspot-oauth-supabase-template
cd hubspot-oauth-supabase-template

# Install dependencies
npm install

# Link to a test Supabase project
supabase login
supabase link --project-ref your-test-project

# Push database schema
supabase db push

# Deploy functions
npm run deploy:functions
```

## 🎯 What We're Looking For

### Bug Fixes
- Security vulnerabilities
- Edge cases not handled
- Performance issues
- Documentation errors

### Features
- Additional HubSpot API examples
- Better error handling
- Improved logging
- Multi-language support
- Testing utilities

### Documentation
- Usage examples
- Troubleshooting guides
- Best practices
- Video tutorials

## 📝 Pull Request Guidelines

### Before Submitting

- [ ] Code follows TypeScript best practices
- [ ] Functions handle errors gracefully
- [ ] Added/updated documentation
- [ ] Tested locally with real HubSpot app
- [ ] No hardcoded secrets or API keys
- [ ] Updated CHANGELOG.md

### PR Description Template

```markdown
## What does this PR do?
Brief description of changes

## Why is this needed?
Problem this solves or feature it adds

## Testing
How you tested the changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tested locally
- [ ] Updated documentation
- [ ] No breaking changes (or documented if so)
```

## 🧪 Testing

### Manual Testing

1. **Test OAuth Flow:**
   ```bash
   # Open oauth-install endpoint
   open "https://YOUR_REF.supabase.co/functions/v1/oauth-install"
   ```

2. **Test API Calls:**
   ```bash
   curl "https://YOUR_REF.supabase.co/functions/v1/example-api?portal_id=PORTAL_ID"
   ```

3. **Check Logs:**
   ```bash
   supabase functions logs oauth-callback
   ```

### Testing Checklist

- [ ] OAuth flow completes successfully
- [ ] Tokens stored in database correctly
- [ ] Token refresh works
- [ ] API calls succeed
- [ ] Error handling works
- [ ] No secrets logged
- [ ] CORS configured properly

## 🎨 Code Style

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types
const portalId: number = 12345;

// ❌ Bad: Implicit any
const portalId = req.query.portal_id;

// ✅ Good: Error handling
try {
  const data = await fetch(url);
} catch (error) {
  console.error('Fetch failed:', error);
  return new Response('Error', { status: 500 });
}

// ✅ Good: Descriptive names
const getHubSpotAccessToken = async () => { ... };

// ❌ Bad: Unclear names
const get = async () => { ... };
```

### Function Structure

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }

  try {
    // 2. Validate input
    const params = validateRequest(req);

    // 3. Main logic
    const result = await doWork(params);

    // 4. Return success
    return jsonResponse(result);

  } catch (error) {
    // 5. Handle errors
    console.error('Error:', error);
    return errorResponse(error);
  }
});
```

## 🔒 Security Guidelines

### Do's ✅

- Use environment variables for secrets
- Validate all user input
- Use parameterized queries
- Enable RLS on database tables
- Log errors (but not secrets)
- Use HTTPS for all redirects

### Don'ts ❌

- Never commit secrets
- Don't log tokens/keys
- Don't trust client input
- Don't expose internal errors to users
- Don't use hardcoded credentials

## 📚 Documentation Guidelines

### Code Comments

```typescript
// ✅ Good: Explains WHY
// Use OAuth token info endpoint because it's most reliable
const tokenInfo = await fetch(`/oauth/v1/access-tokens/${token}`);

// ❌ Bad: Explains WHAT (obvious from code)
// Fetch token info
const tokenInfo = await fetch(`/oauth/v1/access-tokens/${token}`);
```

### README Updates

- Keep examples up-to-date
- Test all command examples
- Include expected output
- Add troubleshooting for common issues

## 🐛 Bug Reports

### Good Bug Report Template

```markdown
**Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Deploy function
2. Call endpoint with X
3. See error Y

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Supabase CLI version: X.Y.Z
- Node version: X.Y.Z
- OS: macOS/Linux/Windows

**Logs:**
```
Paste relevant logs here
```

**Additional Context:**
Any other relevant information
```

## 💡 Feature Requests

### Good Feature Request Template

```markdown
**Problem:**
What problem does this solve?

**Proposed Solution:**
How would you solve it?

**Alternatives Considered:**
What other solutions did you think about?

**Use Case:**
When would this be useful?
```

## 🏷️ Commit Messages

Follow conventional commits:

```bash
# Feature
feat: add token refresh endpoint

# Bug fix
fix: handle missing portal_id gracefully

# Documentation
docs: update deployment guide

# Refactor
refactor: simplify error handling

# Test
test: add OAuth flow test

# Chore
chore: update dependencies
```

## 📦 Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. Create GitHub release with notes

## 🌟 Recognition

Contributors will be:
- Listed in README
- Mentioned in release notes
- Given credit in commit history

## 📞 Getting Help

- 💬 Open a GitHub Discussion
- 🐛 Check existing issues
- 📧 Email: your@email.com

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Give constructive feedback
- Focus on what's best for the community

## ❓ Questions?

Feel free to:
- Open an issue
- Start a discussion
- Reach out directly

---

**Thank you for contributing!** 🙏

