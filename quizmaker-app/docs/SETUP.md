# Setup and Deployment Guide
# QuizMaker Application

**Version:** 1.0  
**Date:** December 16, 2025  
**Platform:** Cloudflare Workers + D1

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Database Migrations](#database-migrations)
6. [Running Locally](#running-locally)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Post-Deployment](#post-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 18.0.0 or higher | Runtime environment |
| **npm** | 9.0.0 or higher | Package manager |
| **Wrangler** | Latest | Cloudflare CLI tool |
| **Git** | 2.0 or higher | Version control |

### Cloudflare Account Setup

1. **Create Cloudflare Account:**
   - Visit [dash.cloudflare.com](https://dash.cloudflare.com)
   - Sign up for a free account
   - Verify your email

2. **Get API Token:**
   - Go to Profile → API Tokens
   - Create token with Workers and D1 permissions
   - Save token securely

3. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

4. **Authenticate Wrangler:**
   ```bash
   wrangler login
   ```

---

## Initial Setup

### 1. Clone/Navigate to Project

```bash
cd quizmaker-app
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 15.4.6
- React 19
- Tailwind CSS 4
- shadcn/ui components
- TypeScript
- Vercel AI SDK
- bcrypt for password hashing
- Zod for validation

### 3. Verify Installation

```bash
npm run lint
```

Expected output: No errors

---

## Database Configuration

### Database Already Created

Your database is already configured:

```json
{
  "binding": "quizmaker_app_database",
  "database_name": "quizmaker-app-database",
  "database_id": "fbe73528-aafa-4d67-8665-35b942f7d275"
}
```

### Verify Database Connection

```bash
# List your D1 databases
wrangler d1 list

# Check database info
wrangler d1 info quizmaker-app-database
```

Expected output should show your database with ID `fbe73528-aafa-4d67-8665-35b942f7d275`

---

## Environment Variables

### Local Development (.dev.vars)

Create `.dev.vars` in the project root:

```bash
# .dev.vars (for local development)
NEXTJS_ENV=development
SESSION_SECRET=your-super-secret-key-change-this-in-production
ADMIN_DEFAULT_PASSWORD=Admin@123
```

**Important:**
- `.dev.vars` is for local development only
- This file should be in `.gitignore`
- Never commit secrets to version control

### Generate Secure Session Secret

```bash
# Generate a random secret (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as `SESSION_SECRET`

### Production Environment Variables (Cloudflare Secrets)

```bash
# Set production secrets
wrangler secret put SESSION_SECRET
# Paste your secret when prompted

wrangler secret put ADMIN_DEFAULT_PASSWORD
# Set a strong admin password
```

### Environment Variable Reference

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `NEXTJS_ENV` | String | Environment name | `development` or `production` |
| `SESSION_SECRET` | String | JWT signing key | 64-character hex string |
| `ADMIN_DEFAULT_PASSWORD` | String | Initial admin password | `Admin@SecurePass123!` |

---

## Database Migrations

### Migration Files Structure

```
migrations/
├── 0001_initial_schema.sql      # Create all tables
├── 0002_seed_admin_user.sql     # Create admin account
└── 0003_create_indexes.sql      # Add indexes for performance
```

### Apply Migrations Locally

```bash
# Apply all pending migrations to local D1
wrangler d1 migrations apply quizmaker-app-database --local
```

Expected output:
```
✅ Successfully applied 3 migrations!
```

### Verify Migration Status

```bash
# List applied migrations
wrangler d1 migrations list quizmaker-app-database --local
```

### Test Database Connection

```bash
# Query the database
wrangler d1 execute quizmaker-app-database --local --command "SELECT * FROM users LIMIT 1"
```

You should see the admin user created by the seed migration.

### Database Schema Verification

```bash
# View all tables
wrangler d1 execute quizmaker-app-database --local --command "SELECT name FROM sqlite_master WHERE type='table'"
```

Expected tables:
- users
- quizzes
- questions
- answer_options
- quiz_attempts
- attempt_answers
- d1_migrations

---

## Running Locally

### Development Server

```bash
# Start Next.js development server with local D1
npm run dev
```

This starts the server on `http://localhost:3000`

**What happens:**
- Next.js dev server starts with Turbopack
- Wrangler binds local D1 database
- Hot module replacement enabled
- TypeScript compilation on the fly

### Access the Application

Open your browser and navigate to:
- **Homepage:** http://localhost:3000
- **Login:** http://localhost:3000/login
- **Register:** http://localhost:3000/register

### Default Admin Credentials

Use these credentials to log in as admin:

```
Email: admin@quizmaker.com
Password: [Value from ADMIN_DEFAULT_PASSWORD in .dev.vars]
```

**Important:** Change the admin password immediately after first login!

### Development Workflow

1. **Make code changes** → Auto-reload
2. **Database schema changes:**
   ```bash
   # Create new migration
   wrangler d1 migrations create quizmaker-app-database migration_name
   
   # Edit the generated SQL file in migrations/
   # Apply migration
   wrangler d1 migrations apply quizmaker-app-database --local
   ```

3. **View logs:** Check terminal for server logs and errors

### Development Tips

- **Hot Reload:** Save files to trigger auto-reload
- **TypeScript Errors:** Fix immediately; they'll prevent compilation
- **Database Queries:** Check Wrangler output for SQL logs
- **React DevTools:** Install browser extension for debugging

---

## Testing

### Run Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
app/
├── lib/
│   ├── services/
│   │   ├── user-service.ts
│   │   └── user-service.test.ts     # Unit tests
│   └── d1-client.test.ts            # Database client tests
└── components/
    └── ui/
        └── Button.test.tsx           # Component tests
```

### Test Coverage Goals

- **Services:** >80% coverage
- **Components:** >70% coverage
- **Database Helpers:** 100% coverage

### Manual Testing Checklist

#### Authentication
- [ ] User registration with valid data
- [ ] User registration with duplicate email (should fail)
- [ ] Login with correct credentials
- [ ] Login with incorrect password (should fail)
- [ ] Session persistence after page refresh
- [ ] Logout functionality

#### Student Flow
- [ ] View published quizzes
- [ ] Start quiz attempt
- [ ] Answer questions
- [ ] Submit quiz
- [ ] View results and score
- [ ] View attempt history

#### Instructor Flow
- [ ] Create new quiz
- [ ] Add questions to quiz
- [ ] Add answer options
- [ ] Mark correct answer
- [ ] Publish quiz
- [ ] Edit quiz (published and unpublished)
- [ ] Delete quiz
- [ ] View quiz attempts and scores

#### Admin Flow
- [ ] View dashboard statistics
- [ ] List all users
- [ ] Change user role
- [ ] Deactivate user account
- [ ] View all quizzes
- [ ] View all quiz attempts
- [ ] Delete inappropriate content

---

## Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No linter errors
- [ ] Environment variables configured in Cloudflare
- [ ] Database migrations applied to production
- [ ] Admin account created
- [ ] README updated with deployment info

### Build Application

```bash
# Build Next.js for production
npm run build
```

Expected output:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

### Apply Database Migrations to Production

**⚠️ CRITICAL: Only run this once and with caution!**

```bash
# Apply migrations to remote/production database
wrangler d1 migrations apply quizmaker-app-database --remote
```

**Important:**
- Test migrations locally first
- Backup data before applying
- Run during maintenance window
- Monitor for errors

### Deploy to Cloudflare Workers

```bash
# Deploy application
npm run deploy
```

This command:
1. Builds the Next.js application
2. Packages for Cloudflare Workers
3. Uploads to Cloudflare
4. Binds D1 database
5. Returns deployment URL

### Deployment Output

```
✨ Successfully deployed to Cloudflare Workers!

🌐 Deployment URL: https://quizmaker-app.your-subdomain.workers.dev

📊 View in dashboard: https://dash.cloudflare.com/...
```

### Custom Domain Setup (Optional)

1. **Add Domain in Cloudflare:**
   - Dashboard → Workers & Pages → Your Worker
   - Custom Domains → Add domain
   - Enter: `quizmaker.yourdomain.com`

2. **DNS Configuration:**
   - Cloudflare handles DNS automatically
   - Wait for propagation (usually instant)

3. **SSL/TLS:**
   - Automatic HTTPS via Cloudflare
   - No configuration needed

---

## Post-Deployment

### Verify Deployment

1. **Access Application:**
   ```
   https://quizmaker-app.your-subdomain.workers.dev
   ```

2. **Health Check:**
   ```bash
   curl https://your-deployment-url.workers.dev/api/health
   ```

3. **Login as Admin:**
   - Use admin credentials
   - Change default password immediately

### Initial Admin Setup

1. **Change Admin Password:**
   - Login with default credentials
   - Profile → Change Password
   - Set strong password

2. **Create Additional Admin (Optional):**
   - Admin Dashboard → Users
   - Register new user
   - Change role to 'admin'

3. **Create Test Instructor:**
   - Register new user with instructor role
   - Test quiz creation flow

4. **Create Sample Quiz:**
   - Create quiz with 5 questions
   - Publish quiz
   - Test as student account

### Monitoring Setup

1. **Cloudflare Analytics:**
   - Dashboard → Workers & Pages → Your Worker
   - View requests, errors, and performance

2. **Enable Logpush (Optional):**
   - Real-time logs to external service
   - Requires paid plan

3. **Set Up Alerts:**
   - Dashboard → Notifications
   - Configure error rate alerts
   - Set up email notifications

---

## Troubleshooting

### Common Issues

#### Issue 1: Database Binding Error

**Symptom:**
```
Error: D1 binding 'quizmaker_app_database' not found
```

**Solution:**
```bash
# Verify wrangler.jsonc has correct binding
cat wrangler.jsonc | grep -A 3 "d1_databases"

# Update binding in wrangler.jsonc if needed
{
  "d1_databases": [
    {
      "binding": "quizmaker_app_database",
      "database_name": "quizmaker-app-database",
      "database_id": "fbe73528-aafa-4d67-8665-35b942f7d275"
    }
  ]
}

# Restart dev server
npm run dev
```

#### Issue 2: Migration Failures

**Symptom:**
```
Error applying migration: table already exists
```

**Solution:**
```bash
# Check applied migrations
wrangler d1 migrations list quizmaker-app-database --local

# If needed, reset local database (DEV ONLY!)
# WARNING: This deletes all local data
rm -rf .wrangler/state/v3/d1
wrangler d1 migrations apply quizmaker-app-database --local
```

#### Issue 3: Session/Authentication Issues

**Symptom:**
```
401 Unauthorized or session not persisting
```

**Solution:**
1. Check `SESSION_SECRET` is set in `.dev.vars`
2. Verify cookie settings in `lib/auth.ts`
3. Clear browser cookies and try again
4. Check browser console for errors

#### Issue 4: Build Failures

**Symptom:**
```
Build failed with TypeScript errors
```

**Solution:**
```bash
# Check TypeScript errors
npm run build

# Fix type errors in code
# Common issues:
# - Missing types for D1 database
# - Incorrect prop types in components

# Regenerate Cloudflare types
npm run cf-typegen
```

#### Issue 5: Can't Log In as Admin

**Symptom:**
Admin login fails after deployment

**Solution:**
```bash
# Check if admin user exists
wrangler d1 execute quizmaker-app-database --local \
  --command "SELECT id, email, role FROM users WHERE role='admin'"

# If no admin, run seed migration again
wrangler d1 execute quizmaker-app-database --local \
  --file ./migrations/0002_seed_admin_user.sql

# Verify admin user created
wrangler d1 execute quizmaker-app-database --local \
  --command "SELECT id, email, role FROM users WHERE role='admin'"
```

### Debug Mode

Enable verbose logging:

```bash
# Development with debug logs
WRANGLER_LOG=debug npm run dev
```

### Reset Local Environment

If all else fails:

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Remove node modules and lock file
rm -rf node_modules package-lock.json

# 3. Clear Next.js cache
rm -rf .next

# 4. Clear Wrangler state
rm -rf .wrangler

# 5. Reinstall dependencies
npm install

# 6. Reapply migrations
wrangler d1 migrations apply quizmaker-app-database --local

# 7. Restart dev server
npm run dev
```

---

## Database Management Commands

### Useful Wrangler D1 Commands

```bash
# Execute SQL query
wrangler d1 execute quizmaker-app-database --local \
  --command "SELECT * FROM users LIMIT 5"

# Execute SQL from file
wrangler d1 execute quizmaker-app-database --local \
  --file ./path/to/query.sql

# Export database
wrangler d1 export quizmaker-app-database --local \
  --output backup.sql

# View database info
wrangler d1 info quizmaker-app-database

# List all databases
wrangler d1 list
```

### Backup Production Database

```bash
# Export production database
wrangler d1 export quizmaker-app-database --remote \
  --output backup-$(date +%Y%m%d).sql

# Store backup securely
# Upload to S3, Google Cloud Storage, etc.
```

---

## Performance Optimization

### Enable Caching

Update `next.config.ts` for static asset caching:

```typescript
export default {
  // ...existing config
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### Database Query Optimization

- Use indexes for frequently queried columns
- Limit SELECT to needed columns
- Use pagination for large result sets
- Cache quiz data for published quizzes

### Cloudflare Workers Optimization

- Minimize cold start time (keep bundle small)
- Use edge caching for static content
- Enable minification in production

---

## Security Checklist

### Pre-Production Security

- [ ] Change default admin password
- [ ] Set strong `SESSION_SECRET`
- [ ] Enable HTTPS only (Cloudflare handles this)
- [ ] Configure CORS headers appropriately
- [ ] Validate all user inputs
- [ ] Implement rate limiting (future enhancement)
- [ ] Regular security audits
- [ ] Keep dependencies updated

### Security Best Practices

1. **Password Policy:**
   - Minimum 8 characters
   - Require uppercase, lowercase, number
   - Hash with bcrypt (salt rounds ≥ 10)

2. **Session Management:**
   - 24-hour token expiration
   - HttpOnly cookies
   - Secure flag in production

3. **Database Security:**
   - Parameterized queries only
   - No raw SQL from user input
   - Validate all IDs and foreign keys

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check system health

**Weekly:**
- Review user activity
- Check for security updates
- Backup database

**Monthly:**
- Update dependencies
- Review access logs
- Performance analysis

### Update Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all dependencies (with caution)
npm update

# Update major versions (test thoroughly)
npm install package@latest
```

---

## Support and Resources

### Documentation Links

- **Next.js:** https://nextjs.org/docs
- **Cloudflare Workers:** https://developers.cloudflare.com/workers/
- **Cloudflare D1:** https://developers.cloudflare.com/d1/
- **Wrangler:** https://developers.cloudflare.com/workers/wrangler/
- **shadcn/ui:** https://ui.shadcn.com/
- **Tailwind CSS:** https://tailwindcss.com/docs

### Getting Help

1. **Check Documentation:** Review this guide and PRD
2. **Search Issues:** Check if problem is known
3. **Cloudflare Community:** https://community.cloudflare.com
4. **GitHub Discussions:** Project repository

---

## Appendix: Complete Command Reference

### Setup Commands
```bash
npm install                          # Install dependencies
wrangler login                       # Authenticate Wrangler
npm run cf-typegen                   # Generate Cloudflare types
```

### Development Commands
```bash
npm run dev                          # Start dev server
npm run build                        # Build for production
npm run lint                         # Run linter
npm test                             # Run tests
```

### Database Commands
```bash
wrangler d1 migrations create DB NAME           # Create migration
wrangler d1 migrations list DB --local          # List migrations
wrangler d1 migrations apply DB --local         # Apply locally
wrangler d1 execute DB --local --command "SQL"  # Execute SQL
wrangler d1 export DB --local --output FILE     # Export database
```

### Deployment Commands
```bash
npm run deploy                       # Deploy to Cloudflare
wrangler secret put VAR_NAME         # Set production secret
wrangler tail                        # View live logs
```

---

**Setup Guide End**

For additional help, refer to:
- **PRD.md** - Product requirements and features
- **DATABASE_SCHEMA.md** - Database structure and queries

