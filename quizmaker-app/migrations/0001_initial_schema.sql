-- Migration: 0001_initial_schema
-- Description: Create all tables for QuizMaker application
-- Date: 2025-12-16

-- ==============================================================================
-- TABLE: users
-- Purpose: Store all user accounts with authentication and role information
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
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

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ==============================================================================
-- TABLE: quizzes
-- Purpose: Store quiz metadata and configuration
-- ==============================================================================
CREATE TABLE IF NOT EXISTS quizzes (
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

-- Indexes for quizzes table
CREATE INDEX IF NOT EXISTS idx_quizzes_instructor_id ON quizzes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_published ON quizzes(is_published);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at);

-- ==============================================================================
-- TABLE: questions
-- Purpose: Store quiz questions with hierarchical relationship to quizzes
-- ==============================================================================
CREATE TABLE IF NOT EXISTS questions (
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

-- Indexes for questions table
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_order_index ON questions(quiz_id, order_index);

-- ==============================================================================
-- TABLE: answer_options
-- Purpose: Store answer choices for multiple-choice questions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS answer_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  option_text TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  CHECK (is_correct IN (0, 1))
);

-- Indexes for answer_options table
CREATE INDEX IF NOT EXISTS idx_answer_options_question_id ON answer_options(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_options_is_correct ON answer_options(question_id, is_correct);

-- ==============================================================================
-- TABLE: quiz_attempts
-- Purpose: Store each student's quiz attempt with metadata
-- ==============================================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
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

-- Indexes for quiz_attempts table
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_submitted_at ON quiz_attempts(submitted_at);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_quiz ON quiz_attempts(student_id, quiz_id);

-- ==============================================================================
-- TABLE: attempt_answers
-- Purpose: Store individual answer selections within an attempt
-- ==============================================================================
CREATE TABLE IF NOT EXISTS attempt_answers (
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
  CHECK (is_correct IN (0, 1)),
  UNIQUE (attempt_id, question_id)
);

-- Indexes for attempt_answers table
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question_id ON attempt_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_question ON attempt_answers(attempt_id, question_id);

-- ==============================================================================
-- Migration Complete
-- ==============================================================================
-- Tables created: 6
-- Indexes created: 17
-- Foreign keys: 8
-- ==============================================================================

