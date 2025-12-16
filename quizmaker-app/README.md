# QuizMaker - Quiz Management & Assessment Platform

A comprehensive web-based quiz application designed for educational institutions to create, distribute, and evaluate quizzes with robust analytics and administrative oversight.

## Features

### For Students
- 📝 Browse and attempt published quizzes
- ⏱️ Timed quiz sessions with automatic submission
- 📊 Immediate score feedback and answer review
- 📈 Track attempt history and performance
- 🔄 Multiple attempts per quiz (configurable)

### For Instructors
- ✏️ Create and manage quizzes
- ❓ Add multiple-choice questions with flexible options
- 📋 Publish/unpublish quizzes
- 👀 View student attempts and statistics
- 📉 Analytics on quiz performance

### For Administrators
- 👥 User management (create, update, delete, role assignment)
- 🎯 System-wide quiz monitoring
- 📊 Dashboard with comprehensive statistics
- 🔍 Activity monitoring and audit logs
- 🛠️ System health metrics

## Technology Stack

- **Framework:** Next.js 15.4.6 (App Router)
- **Runtime:** Cloudflare Workers (serverless)
- **Database:** Cloudflare D1 (SQLite)
- **Authentication:** JWT with bcrypt password hashing
- **Validation:** Zod schemas
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript

## Project Structure

```
quizmaker-app/
├── app/                          # Next.js application
│   ├── api/                      # API routes (to be implemented)
│   ├── (auth)/                   # Auth pages (to be implemented)
│   ├── student/                  # Student pages (to be implemented)
│   ├── instructor/               # Instructor pages (to be implemented)
│   ├── admin/                    # Admin pages (to be implemented)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── lib/                          # Core library
│   ├── d1-client.ts              # Database client
│   ├── types/                    # TypeScript definitions
│   │   └── database.ts           # Database types
│   ├── auth/                     # Authentication
│   │   ├── password.ts           # Password hashing
│   │   └── session.ts            # Session management
│   ├── validations/              # Zod schemas
│   │   ├── auth.ts               # Auth validation
│   │   └── quiz.ts               # Quiz validation
│   └── services/                 # Business logic
│       ├── user-service.ts       # User operations
│       ├── quiz-service.ts       # Quiz management
│       ├── attempt-service.ts    # Quiz attempts
│       └── admin-service.ts      # Admin operations
│
├── migrations/                   # D1 database migrations
│   ├── 0001_initial_schema.sql   # Table creation
│   └── 0002_seed_admin_user.sql  # Admin seed
│
├── docs/                         # Documentation
│   ├── PRD.md                    # Product requirements
│   ├── DATABASE_SCHEMA.md        # Schema documentation
│   ├── SETUP.md                  # Setup guide
│   └── IMPLEMENTATION_STATUS.md  # Implementation status
│
├── wrangler.jsonc                # Cloudflare configuration
├── next.config.ts                # Next.js configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier works)
- Wrangler CLI installed globally

### Installation

1. **Clone the project:**
   ```bash
   cd quizmaker-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create `.dev.vars` in the project root:
   ```env
   NEXTJS_ENV=development
   SESSION_SECRET=your-64-character-hex-secret
   ADMIN_DEFAULT_PASSWORD=Admin@123
   ```

   Generate a secure session secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Apply database migrations:**
   ```bash
   npm run db:migrations:apply
   ```

5. **Verify database:**
   ```bash
   npm run db:execute -- --command "SELECT * FROM users WHERE role='admin'"
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

7. **Access the application:**
   Open http://localhost:3000

## Default Admin Credentials

```
Email: admin@quizmaker.com
Password: Admin@123
```

**⚠️ IMPORTANT:** Change the admin password immediately after first login!

## Database Schema

### Tables
- **users** - User accounts with authentication
- **quizzes** - Quiz metadata
- **questions** - Quiz questions
- **answer_options** - Multiple-choice options
- **quiz_attempts** - Student quiz attempts
- **attempt_answers** - Individual answer records

See `docs/DATABASE_SCHEMA.md` for detailed schema documentation.

## Available Scripts

### Development
```bash
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
npm run lint             # Run ESLint
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

### Database Management
```bash
npm run db:migrations:create migration_name    # Create new migration
npm run db:migrations:list                     # List all migrations
npm run db:migrations:apply                    # Apply migrations locally
npm run db:execute                             # Execute SQL query
```

### Deployment
```bash
npm run deploy           # Build and deploy to Cloudflare Workers
npm run preview          # Build and preview locally
npm run cf-typegen       # Generate Cloudflare types
```

## Implementation Status

### ✅ Completed
- [x] Complete documentation (PRD, Schema, Setup)
- [x] Database schema and migrations
- [x] Authentication system (password hashing, sessions, JWT)
- [x] All backend services (users, quizzes, attempts, admin)
- [x] Validation schemas
- [x] Type definitions

### 🚧 In Progress / To Do
- [ ] API route implementations
- [ ] Frontend pages and components
- [ ] UI components (forms, tables, cards)
- [ ] Authentication UI (login, register)
- [ ] Student dashboard and quiz-taking interface
- [ ] Instructor dashboard and quiz management
- [ ] Admin dashboard and monitoring

See `docs/IMPLEMENTATION_STATUS.md` for detailed status and next steps.

## Development Workflow

### Creating a New Feature

1. **Define types** in `lib/types/database.ts`
2. **Create validation schema** in `lib/validations/`
3. **Implement service** in `lib/services/`
4. **Create API route** in `app/api/`
5. **Build UI component** in `app/components/`
6. **Create page** in `app/(role)/`

### Example: Adding a Feature

```typescript
// 1. Define type
export interface NewFeature {
  id: string;
  name: string;
}

// 2. Create validation
export const newFeatureSchema = z.object({
  name: z.string().min(3),
});

// 3. Implement service
export async function createFeature(db: D1Database, name: string) {
  // Implementation
}

// 4. Create API route
export async function POST(request: NextRequest) {
  // Handle request
}

// 5. Build UI and page
```

## Testing

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Test Structure
```
lib/
├── services/
│   ├── user-service.ts
│   └── user-service.test.ts      # Service tests
└── d1-client.test.ts              # Database client tests
```

## Deployment

### Deploy to Cloudflare Workers

1. **Set production secrets:**
   ```bash
   wrangler secret put SESSION_SECRET
   wrangler secret put ADMIN_DEFAULT_PASSWORD
   ```

2. **Apply database migrations (ONE TIME ONLY):**
   ```bash
   npm run db:migrations:apply:remote
   ```

3. **Deploy application:**
   ```bash
   npm run deploy
   ```

4. **Verify deployment:**
   Visit the provided URL and test login.

### Custom Domain (Optional)

1. Go to Cloudflare Dashboard → Workers & Pages → Your Worker
2. Click Custom Domains → Add domain
3. Enter your domain (e.g., quizmaker.yourdomain.com)
4. Cloudflare handles DNS and SSL automatically

## Security

### Best Practices Implemented
- ✅ Passwords hashed with bcrypt (10 salt rounds)
- ✅ JWT sessions with expiration (24 hours)
- ✅ httpOnly cookies for session storage
- ✅ Role-based access control (RBAC)
- ✅ Parameterized SQL queries (SQL injection prevention)
- ✅ Input validation with Zod schemas
- ✅ Server-only code isolation

### Security Checklist for Production
- [ ] Change default admin password
- [ ] Set strong SESSION_SECRET
- [ ] Enable HTTPS only (automatic with Cloudflare)
- [ ] Configure CORS headers
- [ ] Implement rate limiting (future enhancement)
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Troubleshooting

### Common Issues

#### Database Binding Error
```
Error: D1 binding 'quizmaker_app_database' not found
```
**Solution:** Check `wrangler.jsonc` has correct database ID and restart dev server.

#### Migration Failures
```
Error applying migration: table already exists
```
**Solution:** Check migration status with `npm run db:migrations:list`.

#### Authentication Issues
```
401 Unauthorized
```
**Solution:** Verify SESSION_SECRET is set in `.dev.vars` and clear browser cookies.

See `docs/SETUP.md` for detailed troubleshooting guide.

## Documentation

- **[PRD.md](docs/PRD.md)** - Product Requirements Document
- **[DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - Database structure and relationships
- **[SETUP.md](docs/SETUP.md)** - Detailed setup and deployment guide
- **[IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md)** - Current implementation status

## Contributing

### Development Guidelines
1. Follow TypeScript strict mode
2. Use ESLint configuration
3. Write tests for new services
4. Document public APIs with JSDoc
5. Use conventional commits

### Code Style
- Use `async/await` for asynchronous code
- Prefer `const` over `let`
- Use descriptive variable names
- Add comments for complex logic

## License

Proprietary - All rights reserved

## Support

For issues and questions:
1. Check documentation in `docs/` folder
2. Review `IMPLEMENTATION_STATUS.md` for known issues
3. Check Cloudflare community forums
4. Review Next.js documentation

## Roadmap

### Phase 1 (Current)
- [x] Backend implementation
- [ ] API routes
- [ ] Basic frontend

### Phase 2 (Future)
- [ ] Email verification
- [ ] Password reset flow
- [ ] Quiz categories and tags
- [ ] Question banks
- [ ] Random question order

### Phase 3 (Future)
- [ ] Advanced analytics
- [ ] CSV/PDF exports
- [ ] Quiz templates
- [ ] Collaborative quizzes
- [ ] AI-powered question generation

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zod](https://zod.dev/)

---

**Version:** 1.0.0  
**Last Updated:** December 16, 2025  
**Status:** Backend Complete - Frontend In Progress
