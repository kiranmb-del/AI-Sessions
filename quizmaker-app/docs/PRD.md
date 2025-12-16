# Product Requirements Document (PRD)
# QuizMaker Application

**Version:** 1.0  
**Date:** December 16, 2025  
**Status:** Active Development

---

## 1. Executive Summary

QuizMaker is a comprehensive web-based quiz management and assessment platform designed to facilitate structured knowledge evaluation through multiple-choice quizzes. The system serves three distinct user roles—Instructors, Students, and Administrators—each with role-specific capabilities and access controls.

### 1.1 Vision
To provide an intuitive, secure, and scalable platform for educational institutions and training organizations to create, distribute, and evaluate quizzes with robust analytics and administrative oversight.

### 1.2 Goals
- Enable instructors to create and manage quizzes efficiently
- Provide students with a seamless quiz-taking experience
- Offer administrators comprehensive system oversight and user management
- Ensure data security through authentication and role-based access control
- Track quiz attempts with detailed metrics and scoring

---

## 2. User Roles and Personas

### 2.1 Instructor
**Primary Role:** Content Creator and Quiz Manager

**Key Characteristics:**
- Subject matter experts or educators
- Need to assess student knowledge
- Require analytics on student performance
- Manage multiple quizzes across different topics

**Core Needs:**
- Quick quiz creation workflow
- Flexible question and answer management
- Ability to edit and update quizzes
- View quiz attempts and scores
- Delete outdated quizzes

### 2.2 Student
**Primary Role:** Quiz Taker and Learner

**Key Characteristics:**
- Learners seeking knowledge assessment
- Need clear navigation and intuitive interface
- Want immediate feedback on performance
- May attempt quizzes multiple times

**Core Needs:**
- Easy registration and authentication
- Browse available quizzes by topic
- Take quizzes with clear interface
- View scores and attempt history
- Track personal progress

### 2.3 Administrator
**Primary Role:** System Overseer and Manager

**Key Characteristics:**
- Responsible for system integrity
- Manages user accounts and roles
- Monitors platform activity
- Ensures compliance and security

**Core Needs:**
- User management (create, update, delete, role assignment)
- System-wide quiz monitoring
- View all quiz attempts and analytics
- Moderate content and users
- Access audit logs

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

#### 3.1.1 User Registration
- **FR-AUTH-001:** System shall allow new users to register with email and password
- **FR-AUTH-002:** System shall validate email format and uniqueness
- **FR-AUTH-003:** System shall enforce password strength requirements (minimum 8 characters, at least one uppercase, one lowercase, one number)
- **FR-AUTH-004:** System shall hash passwords using industry-standard algorithms (bcrypt)
- **FR-AUTH-005:** System shall assign default "student" role to new registrations
- **FR-AUTH-006:** System shall require email verification (future enhancement)

#### 3.1.2 User Login
- **FR-AUTH-007:** System shall authenticate users with email and password
- **FR-AUTH-008:** System shall create secure session tokens upon successful authentication
- **FR-AUTH-009:** System shall implement session timeout after 24 hours of inactivity
- **FR-AUTH-010:** System shall provide "Remember Me" functionality (future enhancement)
- **FR-AUTH-011:** System shall log failed login attempts for security monitoring

#### 3.1.3 Authorization
- **FR-AUTH-012:** System shall implement role-based access control (RBAC)
- **FR-AUTH-013:** System shall enforce role permissions on all protected routes
- **FR-AUTH-014:** System shall prevent privilege escalation
- **FR-AUTH-015:** System shall provide middleware for route protection

### 3.2 User Management

#### 3.2.1 Profile Management
- **FR-USER-001:** Users shall view their own profile information
- **FR-USER-002:** Users shall update their name and profile details
- **FR-USER-003:** Users shall change their password
- **FR-USER-004:** System shall validate password changes require current password

#### 3.2.2 Admin User Management
- **FR-USER-005:** Admins shall view all users in the system
- **FR-USER-006:** Admins shall filter users by role
- **FR-USER-007:** Admins shall update user roles
- **FR-USER-008:** Admins shall deactivate/activate user accounts
- **FR-USER-009:** Admins shall delete user accounts
- **FR-USER-010:** System shall cascade delete user-related data appropriately

### 3.3 Quiz Management (Instructor)

#### 3.3.1 Quiz Creation
- **FR-QUIZ-001:** Instructors shall create new quizzes with title and description
- **FR-QUIZ-002:** System shall validate quiz titles are non-empty and unique per instructor
- **FR-QUIZ-003:** Instructors shall specify quiz duration (optional)
- **FR-QUIZ-004:** System shall auto-generate unique quiz IDs
- **FR-QUIZ-005:** System shall record quiz creation timestamp and creator

#### 3.3.2 Question Management
- **FR-QUIZ-006:** Instructors shall add multiple-choice questions to quizzes
- **FR-QUIZ-007:** Each question shall have question text and point value
- **FR-QUIZ-008:** Questions shall support 2-6 answer options
- **FR-QUIZ-009:** Exactly one option shall be marked as correct
- **FR-QUIZ-010:** System shall validate at least one correct answer exists
- **FR-QUIZ-011:** Instructors shall update question text and point values
- **FR-QUIZ-012:** Instructors shall reorder questions within a quiz
- **FR-QUIZ-013:** Instructors shall delete questions from quizzes

#### 3.3.3 Answer Option Management
- **FR-QUIZ-014:** Instructors shall add answer options to questions
- **FR-QUIZ-015:** Each option shall have text and correct/incorrect flag
- **FR-QUIZ-016:** Instructors shall update option text
- **FR-QUIZ-017:** Instructors shall toggle correct answer designation
- **FR-QUIZ-018:** Instructors shall delete answer options
- **FR-QUIZ-019:** System shall prevent deletion if less than 2 options remain

#### 3.3.4 Quiz Lifecycle
- **FR-QUIZ-020:** Instructors shall publish quizzes (make available to students)
- **FR-QUIZ-021:** Instructors shall unpublish quizzes (hide from students)
- **FR-QUIZ-022:** Instructors shall edit unpublished quizzes freely
- **FR-QUIZ-023:** System shall warn when editing published quizzes
- **FR-QUIZ-024:** Instructors shall delete quizzes they own
- **FR-QUIZ-025:** System shall prevent quiz deletion if attempts exist (soft delete)

### 3.4 Quiz Taking (Student)

#### 3.4.1 Quiz Discovery
- **FR-TAKE-001:** Students shall browse all published quizzes
- **FR-TAKE-002:** Students shall search quizzes by title
- **FR-TAKE-003:** Students shall filter quizzes by category/subject
- **FR-TAKE-004:** Students shall view quiz details before starting

#### 3.4.2 Quiz Attempt
- **FR-TAKE-005:** Students shall start a quiz attempt
- **FR-TAKE-006:** System shall create attempt record with start timestamp
- **FR-TAKE-007:** Students shall view one question at a time
- **FR-TAKE-008:** Students shall select one answer per question
- **FR-TAKE-009:** Students shall navigate between questions
- **FR-TAKE-010:** System shall save answers in progress
- **FR-TAKE-011:** Students shall review all answers before submission
- **FR-TAKE-012:** System shall enforce quiz duration if specified
- **FR-TAKE-013:** System shall auto-submit quiz when time expires

#### 3.4.3 Quiz Submission & Scoring
- **FR-TAKE-014:** Students shall submit completed quiz
- **FR-TAKE-015:** System shall calculate score based on correct answers
- **FR-TAKE-016:** System shall record submission timestamp
- **FR-TAKE-017:** System shall calculate attempt duration
- **FR-TAKE-018:** Students shall view immediate score feedback
- **FR-TAKE-019:** Students shall view correct/incorrect answer breakdown
- **FR-TAKE-020:** System shall store all attempt data permanently

#### 3.4.4 Attempt History
- **FR-TAKE-021:** Students shall view their quiz attempt history
- **FR-TAKE-022:** Students shall view scores for past attempts
- **FR-TAKE-023:** Students shall re-attempt quizzes (if allowed)
- **FR-TAKE-024:** System shall track attempt number per student per quiz

### 3.5 Administrative Features

#### 3.5.1 System Monitoring
- **FR-ADMIN-001:** Admins shall view dashboard with system statistics
- **FR-ADMIN-002:** Dashboard shall display total users, quizzes, and attempts
- **FR-ADMIN-003:** Admins shall view recent activity log
- **FR-ADMIN-004:** Admins shall view most active users
- **FR-ADMIN-005:** Admins shall view quiz completion rates

#### 3.5.2 Quiz Oversight
- **FR-ADMIN-006:** Admins shall view all quizzes in system
- **FR-ADMIN-007:** Admins shall view all quiz attempts
- **FR-ADMIN-008:** Admins shall filter attempts by student, quiz, or date
- **FR-ADMIN-009:** Admins shall delete inappropriate quizzes
- **FR-ADMIN-010:** Admins shall unpublish quizzes for review

#### 3.5.3 Content Moderation
- **FR-ADMIN-011:** Admins shall flag quizzes for review
- **FR-ADMIN-012:** Admins shall receive notifications for reported content
- **FR-ADMIN-013:** Admins shall moderate user-generated content

---

## 4. Non-Functional Requirements

### 4.1 Security
- **NFR-SEC-001:** All passwords must be hashed using bcrypt with salt rounds ≥ 10
- **NFR-SEC-002:** Session tokens must be cryptographically secure
- **NFR-SEC-003:** API endpoints must validate user authentication
- **NFR-SEC-004:** API endpoints must enforce role-based authorization
- **NFR-SEC-005:** System must prevent SQL injection through parameterized queries
- **NFR-SEC-006:** System must prevent XSS attacks through input sanitization
- **NFR-SEC-007:** System must implement CSRF protection

### 4.2 Performance
- **NFR-PERF-001:** Page load time must be < 2 seconds
- **NFR-PERF-002:** API response time must be < 500ms for 95th percentile
- **NFR-PERF-003:** System must handle 100 concurrent users
- **NFR-PERF-004:** Database queries must use indexes for common lookups

### 4.3 Usability
- **NFR-USE-001:** Interface must be responsive (mobile, tablet, desktop)
- **NFR-USE-002:** System must provide clear error messages
- **NFR-USE-003:** Forms must validate input client-side and server-side
- **NFR-USE-004:** System must provide loading indicators for async operations

### 4.4 Reliability
- **NFR-REL-001:** System uptime must be ≥ 99.5%
- **NFR-REL-002:** Data must be backed up daily
- **NFR-REL-003:** System must handle errors gracefully without crashing

### 4.5 Scalability
- **NFR-SCALE-001:** System must support 10,000+ users
- **NFR-SCALE-002:** System must support 1,000+ concurrent quiz attempts
- **NFR-SCALE-003:** Database must be optimized for growth

### 4.6 Maintainability
- **NFR-MAINT-001:** Code must follow consistent style guidelines
- **NFR-MAINT-002:** Functions must be documented with JSDoc comments
- **NFR-MAINT-003:** Database schema must use migrations for versioning
- **NFR-MAINT-004:** System must have comprehensive unit test coverage (>80%)

---

## 5. Database Schema

### 5.1 Entity Overview

#### Users Table
Stores all user accounts with authentication and role information.

**Fields:**
- `id` (TEXT, PK): Unique user identifier (UUID)
- `email` (TEXT, UNIQUE): User email address
- `password_hash` (TEXT): Bcrypt hashed password
- `name` (TEXT): User full name
- `role` (TEXT): User role (student, instructor, admin)
- `is_active` (INTEGER): Account active status (0/1)
- `created_at` (INTEGER): Registration timestamp
- `updated_at` (INTEGER): Last update timestamp

**Indexes:**
- Primary key on `id`
- Unique index on `email`
- Index on `role` for filtering

#### Quizzes Table
Stores quiz metadata and configuration.

**Fields:**
- `id` (TEXT, PK): Unique quiz identifier (UUID)
- `title` (TEXT): Quiz title
- `description` (TEXT): Quiz description
- `instructor_id` (TEXT, FK): Creator user ID
- `is_published` (INTEGER): Publication status (0/1)
- `duration_minutes` (INTEGER, NULLABLE): Time limit in minutes
- `created_at` (INTEGER): Creation timestamp
- `updated_at` (INTEGER): Last update timestamp

**Indexes:**
- Primary key on `id`
- Foreign key on `instructor_id` → `users(id)`
- Index on `is_published` for student browsing

#### Questions Table
Stores quiz questions with hierarchical relationship to quizzes.

**Fields:**
- `id` (TEXT, PK): Unique question identifier (UUID)
- `quiz_id` (TEXT, FK): Parent quiz ID
- `question_text` (TEXT): Question content
- `points` (INTEGER): Point value (default 1)
- `order_index` (INTEGER): Display order within quiz
- `created_at` (INTEGER): Creation timestamp
- `updated_at` (INTEGER): Last update timestamp

**Indexes:**
- Primary key on `id`
- Foreign key on `quiz_id` → `quizzes(id)`
- Index on `quiz_id` for question retrieval
- Index on `order_index` for sorting

#### Answer_Options Table
Stores answer choices for questions.

**Fields:**
- `id` (TEXT, PK): Unique option identifier (UUID)
- `question_id` (TEXT, FK): Parent question ID
- `option_text` (TEXT): Answer choice text
- `is_correct` (INTEGER): Correct answer flag (0/1)
- `order_index` (INTEGER): Display order within question
- `created_at` (INTEGER): Creation timestamp

**Indexes:**
- Primary key on `id`
- Foreign key on `question_id` → `questions(id)`
- Index on `question_id` for option retrieval
- Index on `is_correct` for scoring

#### Quiz_Attempts Table
Stores each student's quiz attempt with metadata.

**Fields:**
- `id` (TEXT, PK): Unique attempt identifier (UUID)
- `student_id` (TEXT, FK): Student user ID
- `quiz_id` (TEXT, FK): Quiz ID
- `score` (REAL, NULLABLE): Final score (percentage)
- `points_earned` (INTEGER): Points achieved
- `total_points` (INTEGER): Maximum possible points
- `started_at` (INTEGER): Attempt start timestamp
- `submitted_at` (INTEGER, NULLABLE): Attempt submission timestamp
- `duration_seconds` (INTEGER, NULLABLE): Actual time taken
- `is_completed` (INTEGER): Completion status (0/1)

**Indexes:**
- Primary key on `id`
- Foreign key on `student_id` → `users(id)`
- Foreign key on `quiz_id` → `quizzes(id)`
- Composite index on `student_id, quiz_id` for attempt lookup
- Index on `submitted_at` for chronological queries

#### Attempt_Answers Table
Stores individual answer selections within an attempt.

**Fields:**
- `id` (TEXT, PK): Unique answer identifier (UUID)
- `attempt_id` (TEXT, FK): Parent attempt ID
- `question_id` (TEXT, FK): Question ID
- `selected_option_id` (TEXT, FK, NULLABLE): Selected answer option ID
- `is_correct` (INTEGER): Answer correctness (0/1)
- `points_earned` (INTEGER): Points for this answer
- `answered_at` (INTEGER): Answer timestamp

**Indexes:**
- Primary key on `id`
- Foreign key on `attempt_id` → `quiz_attempts(id)`
- Foreign key on `question_id` → `questions(id)`
- Foreign key on `selected_option_id` → `answer_options(id)`
- Composite index on `attempt_id, question_id` for answer lookup

### 5.2 Relationships

```
users (1) ──< (many) quizzes [instructor_id]
users (1) ──< (many) quiz_attempts [student_id]
quizzes (1) ──< (many) questions [quiz_id]
quizzes (1) ──< (many) quiz_attempts [quiz_id]
questions (1) ──< (many) answer_options [question_id]
questions (1) ──< (many) attempt_answers [question_id]
quiz_attempts (1) ──< (many) attempt_answers [attempt_id]
answer_options (1) ──< (many) attempt_answers [selected_option_id]
```

### 5.3 Cascade Rules

- **Deleting a User (Instructor):** Cascade to `quizzes` (soft delete recommended)
- **Deleting a User (Student):** Retain `quiz_attempts` for integrity (anonymize user)
- **Deleting a Quiz:** Cascade to `questions`, retain `quiz_attempts` (soft delete)
- **Deleting a Question:** Cascade to `answer_options` and `attempt_answers`
- **Deleting an Attempt:** Cascade to `attempt_answers`

---

## 6. User Flows

### 6.1 Student Quiz Flow

```
1. Student registers/logs in
2. Student browses available quizzes (published only)
3. Student selects quiz and views details
4. Student starts quiz attempt
   └─> System creates attempt record
5. Student answers questions one by one
   └─> System saves answers progressively
6. Student reviews all answers
7. Student submits quiz
   └─> System calculates score
   └─> System records submission timestamp
8. Student views results and score breakdown
9. Student can re-attempt or exit
```

### 6.2 Instructor Quiz Creation Flow

```
1. Instructor logs in
2. Instructor navigates to "Create Quiz"
3. Instructor enters quiz title and description
4. Instructor adds questions:
   a. Enter question text
   b. Assign point value
   c. Add answer options (minimum 2)
   d. Mark correct answer
   e. Save question
5. Instructor repeats step 4 for all questions
6. Instructor previews quiz
7. Instructor publishes quiz
   └─> Quiz becomes visible to students
8. Instructor monitors attempt statistics
```

### 6.3 Admin Management Flow

```
1. Admin logs in
2. Admin views dashboard with system metrics
3. Admin can:
   a. Manage users (view, edit roles, deactivate)
   b. View all quizzes (with filters)
   c. Monitor quiz attempts
   d. Review flagged content
   e. Generate reports
4. Admin takes action (approve, moderate, delete)
5. System logs admin actions for audit
```

---

## 7. API Endpoints

### 7.1 Authentication Endpoints

```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - User login
POST   /api/auth/logout         - User logout
GET    /api/auth/session        - Get current user session
```

### 7.2 User Management Endpoints

```
GET    /api/users               - List all users (admin only)
GET    /api/users/:id           - Get user by ID
PUT    /api/users/:id           - Update user
DELETE /api/users/:id           - Delete user (admin only)
PUT    /api/users/:id/role      - Update user role (admin only)
```

### 7.3 Quiz Management Endpoints

```
GET    /api/quizzes             - List quizzes (filtered by role)
GET    /api/quizzes/:id         - Get quiz details
POST   /api/quizzes             - Create quiz (instructor only)
PUT    /api/quizzes/:id         - Update quiz (instructor only)
DELETE /api/quizzes/:id         - Delete quiz (instructor only)
PUT    /api/quizzes/:id/publish - Publish/unpublish quiz
```

### 7.4 Question Endpoints

```
GET    /api/quizzes/:quizId/questions           - List questions
POST   /api/quizzes/:quizId/questions           - Add question
PUT    /api/questions/:id                       - Update question
DELETE /api/questions/:id                       - Delete question
```

### 7.5 Answer Option Endpoints

```
GET    /api/questions/:questionId/options       - List options
POST   /api/questions/:questionId/options       - Add option
PUT    /api/options/:id                         - Update option
DELETE /api/options/:id                         - Delete option
```

### 7.6 Quiz Attempt Endpoints

```
POST   /api/quizzes/:id/start                   - Start quiz attempt
GET    /api/attempts/:id                        - Get attempt details
POST   /api/attempts/:id/answers                - Submit answer
POST   /api/attempts/:id/submit                 - Submit quiz
GET    /api/attempts/:id/results                - Get attempt results
GET    /api/students/me/attempts                - Get my attempts
```

### 7.7 Admin Endpoints

```
GET    /api/admin/dashboard                     - System statistics
GET    /api/admin/attempts                      - All quiz attempts
GET    /api/admin/activity                      - Activity logs
```

---

## 8. Technology Stack

### 8.1 Frontend
- **Framework:** Next.js 15.4.6 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **Component Library:** shadcn/ui
- **Form Management:** react-hook-form + zod
- **State Management:** Zustand (where needed)

### 8.2 Backend
- **Runtime:** Cloudflare Workers (serverless)
- **API:** Next.js API Routes / Server Actions
- **Database:** Cloudflare D1 (SQLite)
- **ORM/Query Builder:** Native D1 Client with custom helpers

### 8.3 Authentication
- **Password Hashing:** bcrypt
- **Session Management:** JWT tokens (httpOnly cookies)
- **Authorization:** Custom RBAC middleware

### 8.4 Development Tools
- **Language:** TypeScript
- **Package Manager:** npm
- **Linting:** ESLint
- **Testing:** Vitest + React Testing Library
- **Deployment:** Wrangler CLI

---

## 9. Security Considerations

### 9.1 Authentication Security
- Passwords hashed with bcrypt (salt rounds: 10+)
- Session tokens stored in httpOnly cookies
- Token expiration enforced (24 hours)
- Rate limiting on login attempts
- Account lockout after failed attempts

### 9.2 Authorization Security
- Role-based access control on all protected routes
- Server-side permission validation
- No client-side role switching
- Audit logging for admin actions

### 9.3 Data Security
- Parameterized SQL queries (prevent SQL injection)
- Input validation and sanitization (prevent XSS)
- CSRF token validation
- Secure headers (CORS, CSP)

### 9.4 Privacy
- Student answers visible only to student and instructors
- Personal data encrypted at rest
- GDPR compliance considerations
- Data retention policies

---

## 10. Future Enhancements

### Phase 2 Features
- **Email Verification:** Verify email addresses on registration
- **Password Reset:** Forgot password flow
- **Quiz Categories:** Organize quizzes by subject/topic
- **Quiz Tags:** Multi-dimensional categorization
- **Question Types:** Support true/false, short answer, essay
- **Question Banks:** Reusable question libraries
- **Random Question Order:** Shuffle questions per attempt
- **Random Option Order:** Shuffle answer options

### Phase 3 Features
- **Analytics Dashboard:** Detailed performance analytics
- **Export Results:** CSV/PDF export of quiz results
- **Quiz Templates:** Pre-built quiz structures
- **Collaborative Quizzes:** Multiple instructors per quiz
- **Timed Questions:** Individual question time limits
- **Partial Credit:** Award points for partially correct answers
- **Feedback Comments:** Instructor feedback on answers
- **Peer Review:** Students review each other's work

### Phase 4 Features
- **AI-Powered Question Generation:** Auto-generate questions from content
- **Adaptive Quizzes:** Difficulty adjusts based on performance
- **Gamification:** Badges, leaderboards, achievements
- **Mobile App:** Native iOS/Android applications
- **Integration APIs:** LMS integration (Canvas, Moodle)
- **Video Questions:** Embed video content in questions
- **Rich Text Editor:** Enhanced formatting for questions

---

## 11. Success Metrics

### 11.1 User Engagement
- Monthly Active Users (MAU)
- Average quizzes created per instructor per month
- Average quiz attempts per student per month
- Quiz completion rate (started vs. submitted)

### 11.2 System Performance
- Average page load time
- API response time (p50, p95, p99)
- Error rate
- System uptime percentage

### 11.3 Quality Metrics
- User satisfaction score (surveys)
- Average quiz quality rating
- Support ticket volume
- Bug report frequency

---

## 12. Risks and Mitigations

### 12.1 Security Risks
- **Risk:** Unauthorized access to quiz answers
- **Mitigation:** Strong RBAC, server-side validation, encrypted storage

### 12.2 Technical Risks
- **Risk:** Database performance degradation with scale
- **Mitigation:** Proper indexing, query optimization, caching strategy

### 12.3 Operational Risks
- **Risk:** Quiz data loss
- **Mitigation:** Automated backups, database replication

### 12.4 User Experience Risks
- **Risk:** Complex UI discourages adoption
- **Mitigation:** User testing, iterative design, clear documentation

---

## 13. Dependencies and Assumptions

### 13.1 Dependencies
- Cloudflare Workers platform availability
- D1 database service reliability
- Third-party npm packages (maintained)

### 13.2 Assumptions
- Users have modern browsers (last 2 versions)
- Stable internet connection required
- Users understand basic quiz concepts
- English language interface (initial version)

---

## 14. Glossary

- **RBAC:** Role-Based Access Control
- **UUID:** Universally Unique Identifier
- **JWT:** JSON Web Token
- **CSRF:** Cross-Site Request Forgery
- **XSS:** Cross-Site Scripting
- **D1:** Cloudflare's distributed SQL database
- **PRD:** Product Requirements Document
- **MAU:** Monthly Active Users

---

## 15. Appendices

### Appendix A: User Role Permission Matrix

| Feature | Student | Instructor | Admin |
|---------|---------|------------|-------|
| Register/Login | ✓ | ✓ | ✓ |
| View Published Quizzes | ✓ | ✓ | ✓ |
| Take Quizzes | ✓ | ✓ | ✗ |
| View Own Attempts | ✓ | ✓ | ✗ |
| Create Quizzes | ✗ | ✓ | ✗ |
| Edit Own Quizzes | ✗ | ✓ | ✗ |
| Delete Own Quizzes | ✗ | ✓ | ✗ |
| View All Attempts for Own Quizzes | ✗ | ✓ | ✗ |
| Manage Users | ✗ | ✗ | ✓ |
| View All Quizzes | ✗ | ✗ | ✓ |
| Delete Any Quiz | ✗ | ✗ | ✓ |
| View All Attempts | ✗ | ✗ | ✓ |
| System Monitoring | ✗ | ✗ | ✓ |

### Appendix B: Database Size Estimates

**Assumptions:**
- 10,000 users
- 1,000 quizzes
- Average 10 questions per quiz
- Average 4 options per question
- Average 5 attempts per student

**Estimated Storage:**
- Users: ~2 MB
- Quizzes: ~1 MB
- Questions: ~10 MB
- Answer Options: ~20 MB
- Quiz Attempts: ~50 MB
- Attempt Answers: ~250 MB
- **Total: ~333 MB**

### Appendix C: API Response Formats

**Success Response:**
```json
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Operation completed successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* additional context */ }
  }
}
```

---

**Document End**

