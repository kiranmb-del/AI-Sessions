# Database Schema Documentation
# QuizMaker Application

**Version:** 1.0  
**Database:** Cloudflare D1 (SQLite)  
**Date:** December 16, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Table Specifications](#table-specifications)
4. [Relationships](#relationships)
5. [Indexes](#indexes)
6. [Constraints and Validation](#constraints-and-validation)
7. [Migration Strategy](#migration-strategy)
8. [Data Dictionary](#data-dictionary)

---

## Overview

The QuizMaker database schema is designed to support a hierarchical quiz structure with robust user management, authentication, and attempt tracking. The schema follows normalized database design principles (3NF) while maintaining efficient query patterns for common operations.

### Key Design Principles

1. **Data Integrity:** Foreign key constraints ensure referential integrity
2. **Auditability:** All tables include timestamp fields for tracking
3. **Soft Deletes:** Critical data (quizzes, attempts) supports soft deletion
4. **Scalability:** Proper indexing for performance at scale
5. **Flexibility:** Schema supports future enhancements without major refactoring

### Database Statistics (Estimated)

- **Total Tables:** 6
- **Total Relationships:** 8
- **Total Indexes:** 15+
- **Estimated Size (10K users):** ~333 MB

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         QuizMaker Database Schema                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│       USERS          │
│──────────────────────│
│ PK id (TEXT)         │◄──┐
│    email (TEXT)      │   │
│    password_hash     │   │
│    name (TEXT)       │   │
│    role (TEXT)       │   │ Instructor creates quizzes
│    is_active (INT)   │   │
│    created_at (INT)  │   │
│    updated_at (INT)  │   │
└──────────────────────┘   │
         △                 │
         │                 │
         │ Student         │
         │ attempts        │
         │                 │
         │                 │
┌────────┴──────────┐  ┌───┴──────────────────┐
│  QUIZ_ATTEMPTS    │  │      QUIZZES         │
│───────────────────│  │──────────────────────│
│ PK id (TEXT)      │  │ PK id (TEXT)         │◄──┐
│ FK student_id     │  │ FK instructor_id     │   │
│ FK quiz_id        │──►│    title (TEXT)      │   │
│    score (REAL)   │  │    description (TEXT)│   │ Quiz has questions
│    points_earned  │  │    is_published (INT)│   │
│    total_points   │  │    duration_minutes  │   │
│    started_at     │  │    created_at (INT)  │   │
│    submitted_at   │  │    updated_at (INT)  │   │
│    duration_secs  │  └──────────────────────┘   │
│    is_completed   │                              │
└───────────────────┘         ┌────────────────────┘
         │                    │
         │                    │
         │              ┌─────┴───────────────┐
         │              │    QUESTIONS        │
         │              │─────────────────────│
         │              │ PK id (TEXT)        │◄──┐
         │              │ FK quiz_id          │   │
         │              │    question_text    │   │
         │              │    points (INT)     │   │ Question has options
         │              │    order_index (INT)│   │
         │              │    created_at (INT) │   │
         │              │    updated_at (INT) │   │
         │              └─────────────────────┘   │
         │                      △                 │
         │                      │                 │
         │                      │          ┌──────┴──────────────┐
         │                      │          │  ANSWER_OPTIONS     │
         │                      │          │─────────────────────│
         │                      │          │ PK id (TEXT)        │
         │                      │          │ FK question_id      │
         │                      │          │    option_text      │
         │                      │          │    is_correct (INT) │
         │                      │          │    order_index (INT)│
         │                      │          │    created_at (INT) │
         │                      │          └─────────────────────┘
         │                      │                      │
         │                      │                      │
         │              ┌───────┴──────────────────────┘
         │              │
         │      ┌───────▼──────────────────┐
         └──────►  ATTEMPT_ANSWERS         │
                │──────────────────────────│
                │ PK id (TEXT)             │
                │ FK attempt_id            │
                │ FK question_id           │
                │ FK selected_option_id    │
                │    is_correct (INT)      │
                │    points_earned (INT)   │
                │    answered_at (INT)     │
                └──────────────────────────┘

Legend:
  PK = Primary Key
  FK = Foreign Key
  ──► = One-to-Many Relationship
  ◄── = Foreign Key Reference
```

---

## Table Specifications

### 1. users

**Purpose:** Stores all user accounts including students, instructors, and administrators.

**Schema:**

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  CHECK (role IN ('student', 'instructor', 'admin')),
  CHECK (is_active IN (0, 1))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```

**Fields:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 format |
| `email` | TEXT | NOT NULL, UNIQUE | User email (lowercase) |
| `password_hash` | TEXT | NOT NULL | Bcrypt hashed password |
| `name` | TEXT | NOT NULL | User's full name |
| `role` | TEXT | NOT NULL, DEFAULT 'student' | One of: student, instructor, admin |
| `is_active` | INTEGER | NOT NULL, DEFAULT 1 | 1=active, 0=deactivated |
| `created_at` | INTEGER | NOT NULL | Unix timestamp (milliseconds) |
| `updated_at` | INTEGER | NOT NULL | Unix timestamp (milliseconds) |

**Business Rules:**
- Email must be unique and validated format
- Password must be hashed with bcrypt (salt rounds ≥ 10)
- Default role is 'student' on registration
- Admin accounts should be created manually (seeded)
- Soft delete via `is_active` flag

---

### 2. quizzes

**Purpose:** Stores quiz metadata and configuration created by instructors.

**Schema:**

```sql
CREATE TABLE quizzes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor_id TEXT NOT NULL,
  is_published INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (is_published IN (0, 1)),
  CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

CREATE INDEX idx_quizzes_instructor_id ON quizzes(instructor_id);
CREATE INDEX idx_quizzes_is_published ON quizzes(is_published);
CREATE INDEX idx_quizzes_created_at ON quizzes(created_at);
```

**Fields:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 format |
| `title` | TEXT | NOT NULL | Quiz title (max 255 chars recommended) |
| `description` | TEXT | NULLABLE | Quiz description/instructions |
| `instructor_id` | TEXT | NOT NULL, FK → users(id) | Quiz creator |
| `is_published` | INTEGER | NOT NULL, DEFAULT 0 | 0=draft, 1=published |
| `duration_minutes` | INTEGER | NULLABLE | Time limit (NULL = no limit) |
| `created_at` | INTEGER | NOT NULL | Unix timestamp (milliseconds) |
| `updated_at` | INTEGER | NOT NULL | Unix timestamp (milliseconds) |

**Business Rules:**
- Title must be non-empty and unique per instructor
- Only published quizzes visible to students
- Duration is optional (NULL means unlimited time)
- Instructor must have 'instructor' or 'admin' role
- Cascade delete when instructor deleted (consider soft delete)

---

### 3. questions

**Purpose:** Stores individual questions belonging to quizzes.

**Schema:**

```sql
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  CHECK (points > 0)
);

CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_questions_order_index ON questions(quiz_id, order_index);
```

**Fields:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 format |
| `quiz_id` | TEXT | NOT NULL, FK → quizzes(id) | Parent quiz |
| `question_text` | TEXT | NOT NULL | Question content |
| `points` | INTEGER | NOT NULL, DEFAULT 1 | Point value (> 0) |
| `order_index` | INTEGER | NOT NULL | Display order (0-based) |
| `created_at` | INTEGER | NOT NULL | Unix timestamp (milliseconds) |
| `updated_at` | INTEGER | NOT NULL | Unix timestamp (milliseconds) |

**Business Rules:**
- Questions cascade delete when quiz deleted
- `order_index` determines display sequence
- Points must be positive integer
- Question text should support plain text (future: rich text)

---

### 4. answer_options

**Purpose:** Stores answer choices for multiple-choice questions.

**Schema:**

```sql
CREATE TABLE answer_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  option_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  CHECK (is_correct IN (0, 1))
);

CREATE INDEX idx_answer_options_question_id ON answer_options(question_id);
CREATE INDEX idx_answer_options_is_correct ON answer_options(question_id, is_correct);
```

**Fields:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 format |
| `question_id` | TEXT | NOT NULL, FK → questions(id) | Parent question |
| `option_text` | TEXT | NOT NULL | Answer choice text |
| `is_correct` | INTEGER | NOT NULL, DEFAULT 0 | 1=correct, 0=incorrect |
| `order_index` | INTEGER | NOT NULL | Display order (0-based) |
| `created_at` | INTEGER | NOT NULL | Unix timestamp (milliseconds) |

**Business Rules:**
- Each question must have at least 2 options
- Exactly one option must be marked as correct
- Options cascade delete when question deleted
- `order_index` determines display sequence (can be randomized in UI)
- Maximum 6 options per question recommended

---

### 5. quiz_attempts

**Purpose:** Stores each quiz attempt by a student with scoring and timing data.

**Schema:**

```sql
CREATE TABLE quiz_attempts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  score REAL,
  points_earned INTEGER,
  total_points INTEGER,
  started_at INTEGER NOT NULL,
  submitted_at INTEGER,
  duration_seconds INTEGER,
  is_completed INTEGER NOT NULL DEFAULT 0,
  
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  CHECK (is_completed IN (0, 1)),
  CHECK (score IS NULL OR (score >= 0 AND score <= 100))
);

CREATE INDEX idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_submitted_at ON quiz_attempts(submitted_at);
CREATE INDEX idx_quiz_attempts_student_quiz ON quiz_attempts(student_id, quiz_id);
```

**Fields:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 format |
| `student_id` | TEXT | NOT NULL, FK → users(id) | Student taking quiz |
| `quiz_id` | TEXT | NOT NULL, FK → quizzes(id) | Quiz being attempted |
| `score` | REAL | NULLABLE | Percentage score (0-100) |
| `points_earned` | INTEGER | NULLABLE | Points achieved |
| `total_points` | INTEGER | NULLABLE | Maximum possible points |
| `started_at` | INTEGER | NOT NULL | Attempt start timestamp |
| `submitted_at` | INTEGER | NULLABLE | Submission timestamp (NULL if in progress) |
| `duration_seconds` | INTEGER | NULLABLE | Actual time taken |
| `is_completed` | INTEGER | NOT NULL, DEFAULT 0 | 0=in progress, 1=submitted |

**Business Rules:**
- `started_at` set when student begins quiz
- `submitted_at` and scoring fields populated on submission
- `duration_seconds` = submitted_at - started_at
- `score` = (points_earned / total_points) * 100
- Multiple attempts allowed per student per quiz
- Incomplete attempts remain in database for resume capability

---

### 6. attempt_answers

**Purpose:** Stores individual answer selections within a quiz attempt.

**Schema:**

```sql
CREATE TABLE attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_option_id TEXT,
  is_correct INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  answered_at INTEGER NOT NULL,
  
  FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (selected_option_id) REFERENCES answer_options(id) ON DELETE SET NULL,
  CHECK (is_correct IN (0, 1))
);

CREATE INDEX idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);
CREATE INDEX idx_attempt_answers_question_id ON attempt_answers(question_id);
CREATE INDEX idx_attempt_answers_attempt_question ON attempt_answers(attempt_id, question_id);
```

**Fields:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 format |
| `attempt_id` | TEXT | NOT NULL, FK → quiz_attempts(id) | Parent attempt |
| `question_id` | TEXT | NOT NULL, FK → questions(id) | Question being answered |
| `selected_option_id` | TEXT | NULLABLE, FK → answer_options(id) | Selected answer (NULL if skipped) |
| `is_correct` | INTEGER | NOT NULL, DEFAULT 0 | 1=correct, 0=incorrect |
| `points_earned` | INTEGER | NOT NULL, DEFAULT 0 | Points awarded |
| `answered_at` | INTEGER | NOT NULL | Answer timestamp |

**Business Rules:**
- One record per question per attempt
- `selected_option_id` NULL means question skipped
- `is_correct` determined by comparing with answer_options.is_correct
- `points_earned` = question.points if correct, else 0
- Answers cascade delete when attempt deleted
- Composite unique constraint on (attempt_id, question_id)

---

## Relationships

### Relationship Summary

| Parent Table | Child Table | Relationship Type | Foreign Key | Cascade Rule |
|--------------|-------------|-------------------|-------------|--------------|
| users | quizzes | One-to-Many | instructor_id | CASCADE |
| users | quiz_attempts | One-to-Many | student_id | CASCADE |
| quizzes | questions | One-to-Many | quiz_id | CASCADE |
| quizzes | quiz_attempts | One-to-Many | quiz_id | CASCADE |
| questions | answer_options | One-to-Many | question_id | CASCADE |
| questions | attempt_answers | One-to-Many | question_id | CASCADE |
| quiz_attempts | attempt_answers | One-to-Many | attempt_id | CASCADE |
| answer_options | attempt_answers | One-to-Many | selected_option_id | SET NULL |

### Detailed Relationship Descriptions

#### users → quizzes (instructor_id)
- **Type:** One-to-Many
- **Description:** An instructor can create multiple quizzes
- **Cascade:** DELETE CASCADE (or consider soft delete)
- **Business Rule:** Only users with 'instructor' or 'admin' role can create quizzes

#### users → quiz_attempts (student_id)
- **Type:** One-to-Many
- **Description:** A student can attempt multiple quizzes
- **Cascade:** DELETE CASCADE (or anonymize for audit trail)
- **Business Rule:** Only users with 'student' role can create attempts

#### quizzes → questions (quiz_id)
- **Type:** One-to-Many
- **Description:** A quiz contains multiple questions
- **Cascade:** DELETE CASCADE
- **Business Rule:** Quiz must have at least 1 question to be published

#### quizzes → quiz_attempts (quiz_id)
- **Type:** One-to-Many
- **Description:** A quiz can have multiple attempts by different students
- **Cascade:** CASCADE or RESTRICT (consider retention for analytics)
- **Business Rule:** Attempts should be retained even if quiz unpublished

#### questions → answer_options (question_id)
- **Type:** One-to-Many
- **Description:** A question has multiple answer options
- **Cascade:** DELETE CASCADE
- **Business Rule:** Minimum 2 options, exactly 1 must be correct

#### questions → attempt_answers (question_id)
- **Type:** One-to-Many
- **Description:** A question is answered in multiple attempts
- **Cascade:** DELETE CASCADE
- **Business Rule:** One answer per question per attempt

#### quiz_attempts → attempt_answers (attempt_id)
- **Type:** One-to-Many
- **Description:** An attempt contains answers to multiple questions
- **Cascade:** DELETE CASCADE
- **Business Rule:** Number of answers ≤ number of questions in quiz

#### answer_options → attempt_answers (selected_option_id)
- **Type:** One-to-Many
- **Description:** An option can be selected in multiple attempts
- **Cascade:** SET NULL (preserve attempt even if option deleted)
- **Business Rule:** NULL means question skipped or option deleted

---

## Indexes

### Index Strategy

Indexes are created based on common query patterns to optimize performance:

1. **Primary Key Indexes:** Automatic on all `id` columns
2. **Foreign Key Indexes:** Speed up JOIN operations
3. **Filter Indexes:** Common WHERE clause columns (role, is_published, is_active)
4. **Composite Indexes:** Multi-column queries (student_id + quiz_id)
5. **Sort Indexes:** ORDER BY columns (created_at, order_index)

### Index Listing

| Table | Index Name | Columns | Purpose |
|-------|------------|---------|---------|
| users | idx_users_email | email | Login lookup, uniqueness |
| users | idx_users_role | role | Role-based queries |
| users | idx_users_is_active | is_active | Active user filtering |
| quizzes | idx_quizzes_instructor_id | instructor_id | Instructor's quizzes |
| quizzes | idx_quizzes_is_published | is_published | Student quiz browsing |
| quizzes | idx_quizzes_created_at | created_at | Recent quizzes sorting |
| questions | idx_questions_quiz_id | quiz_id | Quiz questions lookup |
| questions | idx_questions_order_index | quiz_id, order_index | Ordered question retrieval |
| answer_options | idx_answer_options_question_id | question_id | Question options lookup |
| answer_options | idx_answer_options_is_correct | question_id, is_correct | Correct answer validation |
| quiz_attempts | idx_quiz_attempts_student_id | student_id | Student's attempts |
| quiz_attempts | idx_quiz_attempts_quiz_id | quiz_id | Quiz attempts analytics |
| quiz_attempts | idx_quiz_attempts_submitted_at | submitted_at | Recent attempts sorting |
| quiz_attempts | idx_quiz_attempts_student_quiz | student_id, quiz_id | Duplicate attempt check |
| attempt_answers | idx_attempt_answers_attempt_id | attempt_id | Attempt answers lookup |
| attempt_answers | idx_attempt_answers_question_id | question_id | Question analytics |
| attempt_answers | idx_attempt_answers_attempt_question | attempt_id, question_id | Unique answer constraint |

---

## Constraints and Validation

### Application-Level Validations

These validations are enforced in the application code:

#### users
- Email: Valid format (regex), lowercase normalization
- Password: Minimum 8 characters, complexity requirements
- Name: 2-100 characters, no special characters
- Role: Must be one of the three defined roles

#### quizzes
- Title: 3-255 characters, no leading/trailing whitespace
- Description: Max 2000 characters
- Duration: 1-1440 minutes (if specified)

#### questions
- Question text: 10-1000 characters
- Points: 1-100 points
- Order index: Non-negative, sequential

#### answer_options
- Option text: 1-500 characters
- Minimum 2 options per question
- Maximum 6 options per question
- Exactly one correct answer required

#### quiz_attempts
- Student must have 'student' role
- Quiz must be published (unless admin/instructor)
- Cannot start new attempt if incomplete attempt exists

#### attempt_answers
- Selected option must belong to the question
- Cannot change answer after submission

### Database-Level Constraints

```sql
-- users table
CHECK (role IN ('student', 'instructor', 'admin'))
CHECK (is_active IN (0, 1))

-- quizzes table
CHECK (is_published IN (0, 1))
CHECK (duration_minutes IS NULL OR duration_minutes > 0)

-- questions table
CHECK (points > 0)

-- answer_options table
CHECK (is_correct IN (0, 1))

-- quiz_attempts table
CHECK (is_completed IN (0, 1))
CHECK (score IS NULL OR (score >= 0 AND score <= 100))

-- attempt_answers table
CHECK (is_correct IN (0, 1))
```

---

## Migration Strategy

### Migration Management

All schema changes are managed through Wrangler D1 migrations:

```bash
# Create new migration
wrangler d1 migrations create quizmaker-app-database migration_name

# List migrations
wrangler d1 migrations list quizmaker-app-database --local

# Apply migrations locally
wrangler d1 migrations apply quizmaker-app-database --local

# Apply migrations to production (manual approval required)
wrangler d1 migrations apply quizmaker-app-database --remote
```

### Migration Files

Located in: `migrations/`

1. **0001_initial_schema.sql** - Create all tables
2. **0002_seed_admin_user.sql** - Create initial admin account
3. **0003_create_indexes.sql** - Add performance indexes

### Rollback Strategy

D1 does not support automatic rollback. Manual rollback requires:
1. Create reverse migration SQL
2. Test in local environment
3. Apply to production during maintenance window
4. Verify data integrity

---

## Data Dictionary

### Data Types

| SQLite Type | Usage | Example |
|-------------|-------|---------|
| TEXT | Strings, UUIDs | 'user-123-abc', 'john@example.com' |
| INTEGER | Numbers, booleans, timestamps | 1701878400000 (timestamp in ms) |
| REAL | Floating point | 85.5 (percentage score) |

### Special Field Conventions

#### Identifiers (id columns)
- **Format:** UUID v4 (36 characters with dashes)
- **Example:** `550e8400-e29b-41d4-a716-446655440000`
- **Generation:** Application-level using crypto.randomUUID()

#### Timestamps
- **Format:** Unix timestamp in milliseconds
- **Type:** INTEGER
- **Example:** 1701878400000 (represents Dec 6, 2023, 16:00:00 UTC)
- **Generation:** `Date.now()` in JavaScript

#### Boolean Fields
- **Format:** 0 (false) or 1 (true)
- **Type:** INTEGER
- **Fields:** is_active, is_published, is_correct, is_completed
- **Note:** SQLite doesn't have native boolean type

#### Email Addresses
- **Format:** Lowercase, validated format
- **Max Length:** 255 characters
- **Example:** user@example.com
- **Normalization:** Convert to lowercase before storage

#### Passwords
- **Format:** Bcrypt hash
- **Length:** 60 characters (bcrypt output)
- **Example:** `$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`
- **Hashing:** Use bcrypt with salt rounds ≥ 10

#### Roles
- **Values:** 'student', 'instructor', 'admin'
- **Default:** 'student'
- **Case:** Lowercase

---

## Query Performance Considerations

### Optimized Query Patterns

#### 1. Fetch Quiz with Questions and Options
```sql
-- Use separate queries with indexes instead of large JOIN
SELECT * FROM quizzes WHERE id = ?1;
SELECT * FROM questions WHERE quiz_id = ?1 ORDER BY order_index;
SELECT * FROM answer_options WHERE question_id IN (...) ORDER BY order_index;
```

#### 2. Student's Quiz Attempts
```sql
-- Composite index on (student_id, quiz_id) makes this fast
SELECT * FROM quiz_attempts 
WHERE student_id = ?1 AND is_completed = 1 
ORDER BY submitted_at DESC;
```

#### 3. Quiz Leaderboard
```sql
-- Index on quiz_id and score
SELECT qa.*, u.name 
FROM quiz_attempts qa
JOIN users u ON qa.student_id = u.id
WHERE qa.quiz_id = ?1 AND qa.is_completed = 1
ORDER BY qa.score DESC, qa.duration_seconds ASC
LIMIT 10;
```

### Anti-Patterns to Avoid

❌ **Don't:** Fetch all quizzes with all questions and options in one query
✅ **Do:** Use pagination and lazy loading

❌ **Don't:** Use `SELECT *` in production code
✅ **Do:** Select only needed columns

❌ **Don't:** Use `LIKE '%search%'` without full-text search
✅ **Do:** Use prefix search or implement FTS5

---

## Backup and Recovery

### Backup Strategy

1. **Automated Backups:** Cloudflare D1 provides automatic backups
2. **Export Schedule:** Weekly exports to durable storage
3. **Retention:** 30-day backup retention

### Export Command
```bash
# Export database to SQL file
wrangler d1 export quizmaker-app-database --output backup.sql
```

### Recovery Procedure
1. Stop application traffic
2. Restore from backup
3. Verify data integrity
4. Resume traffic
5. Notify users of downtime

---

## Future Schema Enhancements

### Phase 2 Additions

**quiz_categories table**
```sql
CREATE TABLE quiz_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL
);
```

**quiz_tags table** (many-to-many)
```sql
CREATE TABLE quiz_tags (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);
```

**question_banks table** (reusable questions)
```sql
CREATE TABLE question_banks (
  id TEXT PRIMARY KEY,
  instructor_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (instructor_id) REFERENCES users(id)
);
```

---

**Document End**

