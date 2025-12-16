# Local Development Guide

## Important: Database Bindings

The QuizMaker app uses Cloudflare D1 database, which requires Cloudflare Workers environment to access. This means **you cannot use `next dev` directly** because it doesn't provide the D1 database binding.

## Development Options

### Option 1: Use Wrangler Dev (Recommended)

This runs your Next.js app through Cloudflare Workers locally with full database access:

```bash
npm run dev
```

This will:
1. Build the Next.js application
2. Start Wrangler with D1 bindings
3. Provide access to http://localhost:8788

**Note:** This requires building before each change, so it's slower but provides the real environment.

### Option 2: Use Next.js Dev (UI Development Only)

For rapid UI development without database:

```bash
npm run dev:next
```

Access at http://localhost:3000

**Limitations:**
- ❌ Database operations will fail
- ❌ API routes won't work
- ✅ Good for styling and UI component development

### Option 3: Build and Preview

Full production-like environment:

```bash
npm run preview
```

## Recommended Workflow

### For Backend Development (APIs, Database)
```bash
# 1. Make sure migrations are applied
npm run db:migrations:apply

# 2. Run with Wrangler
npm run dev

# 3. Access at http://localhost:8788
```

### For Frontend Development (UI Only)
```bash
# Use Next.js dev for fast refresh
npm run dev:next

# Access at http://localhost:3000
# Note: Login/Register won't work without database
```

## First Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Create `.dev.vars`:
   ```env
   NEXTJS_ENV=development
   SESSION_SECRET=your-64-char-hex-string
   ADMIN_DEFAULT_PASSWORD=Admin@123
   ```

3. **Apply database migrations:**
   ```bash
   npm run db:migrations:apply
   ```

4. **Verify database:**
   ```bash
   npm run db:execute -- --command "SELECT * FROM users WHERE role='admin'"
   ```

5. **Start development:**
   ```bash
   npm run dev
   ```

## Testing the Application

### Test Registration
```bash
curl -X POST http://localhost:8788/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8788/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@quizmaker.com",
    "password": "Admin@123"
  }'
```

## Common Issues

### "Database binding not found"
**Solution:** Use `npm run dev` instead of `npm run dev:next`

### "Module not found" errors after changes
**Solution:** 
```bash
# Rebuild the application
npm run build
npm run dev
```

### Port already in use
**Solution:**
```bash
# Kill the process on port 8788
# Windows:
netstat -ano | findstr :8788
taskkill /PID <PID> /F

# Then restart
npm run dev
```

### Database changes not reflected
**Solution:**
```bash
# Create and apply migration
npm run db:migrations:create my_changes
# Edit the migration file
npm run db:migrations:apply
```

## Development Tips

1. **Hot Reload Limitation:** Wrangler dev requires rebuild for changes. Consider:
   - Use `npm run dev:next` for UI-only work
   - Use `npm run dev` when testing with database

2. **Database Queries:** Test SQL queries directly:
   ```bash
   npm run db:execute -- --command "SELECT * FROM quizzes LIMIT 5"
   ```

3. **Watch Mode:** For faster rebuilds, use:
   ```bash
   # Terminal 1: Watch for changes
   npx next build --watch
   
   # Terminal 2: Run wrangler
   wrangler pages dev .open-next/worker
   ```

## Production Deployment

When ready to deploy:

```bash
# 1. Build the application
npm run build

# 2. Deploy to Cloudflare
npm run deploy
```

## Additional Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

