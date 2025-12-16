/**
 * Database Type Definitions
 * 
 * This file contains TypeScript interfaces for all database tables
 * and related types used throughout the application.
 */

/**
 * User Roles in the System
 */
export type UserRole = 'student' | 'instructor' | 'admin';

/**
 * User Table Record
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  is_active: number; // 0 = inactive, 1 = active
  created_at: number; // Unix timestamp in milliseconds
  updated_at: number; // Unix timestamp in milliseconds
}

/**
 * User without sensitive data (for API responses)
 */
export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

/**
 * Quiz Table Record
 */
export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  instructor_id: string;
  is_published: number; // 0 = draft, 1 = published
  duration_minutes: number | null;
  created_at: number;
  updated_at: number;
}

/**
 * Quiz with instructor information
 */
export interface QuizWithInstructor extends Quiz {
  instructor_name: string;
  instructor_email: string;
}

/**
 * Question Table Record
 */
export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  points: number;
  order_index: number;
  created_at: number;
  updated_at: number;
}

/**
 * Answer Option Table Record
 */
export interface AnswerOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: number; // 0 = incorrect, 1 = correct
  order_index: number;
  created_at: number;
}

/**
 * Answer Option without correct answer indicator (for students)
 */
export interface AnswerOptionPublic {
  id: string;
  question_id: string;
  option_text: string;
  order_index: number;
}

/**
 * Question with Answer Options
 */
export interface QuestionWithOptions extends Question {
  options: AnswerOption[];
}

/**
 * Question with Public Answer Options (for students during quiz)
 */
export interface QuestionWithPublicOptions extends Question {
  options: AnswerOptionPublic[];
}

/**
 * Quiz Attempt Table Record
 */
export interface QuizAttempt {
  id: string;
  student_id: string;
  quiz_id: string;
  score: number | null; // Percentage (0-100)
  points_earned: number | null;
  total_points: number | null;
  started_at: number;
  submitted_at: number | null;
  duration_seconds: number | null;
  is_completed: number; // 0 = in progress, 1 = completed
}

/**
 * Quiz Attempt with Student and Quiz Information
 */
export interface QuizAttemptWithDetails extends QuizAttempt {
  student_name: string;
  student_email: string;
  quiz_title: string;
  quiz_description: string | null;
}

/**
 * Attempt Answer Table Record
 */
export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
  is_correct: number; // 0 = incorrect, 1 = correct
  points_earned: number;
  answered_at: number;
}

/**
 * Attempt Answer with Question and Option Details
 */
export interface AttemptAnswerWithDetails extends AttemptAnswer {
  question_text: string;
  question_points: number;
  selected_option_text: string | null;
  correct_option_id: string;
  correct_option_text: string;
}

/**
 * Complete Quiz Data (for instructors)
 */
export interface QuizComplete extends Quiz {
  questions: QuestionWithOptions[];
  total_questions: number;
  total_points: number;
}

/**
 * Complete Quiz Attempt Data (with all answers)
 */
export interface QuizAttemptComplete extends QuizAttempt {
  quiz_title: string;
  quiz_description: string | null;
  answers: AttemptAnswerWithDetails[];
}

/**
 * Quiz Statistics
 */
export interface QuizStats {
  quiz_id: string;
  quiz_title: string;
  total_attempts: number;
  completed_attempts: number;
  average_score: number | null;
  highest_score: number | null;
  lowest_score: number | null;
  average_duration_seconds: number | null;
}

/**
 * User Statistics
 */
export interface UserStats {
  user_id: string;
  user_name: string;
  user_email: string;
  role: UserRole;
  total_quizzes_created?: number; // For instructors
  total_attempts?: number; // For students
  average_score?: number | null; // For students
  quizzes_passed?: number; // For students (score >= 70%)
}

/**
 * Dashboard Statistics (for admins)
 */
export interface DashboardStats {
  total_users: number;
  total_students: number;
  total_instructors: number;
  total_admins: number;
  total_quizzes: number;
  published_quizzes: number;
  total_attempts: number;
  completed_attempts: number;
  average_score: number | null;
}

/**
 * Activity Log Entry (for monitoring)
 */
export interface ActivityLog {
  timestamp: number;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string | null;
}

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalResults: number;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * API Response Types
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Form Input Types (for validation)
 */

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateQuizInput {
  title: string;
  description?: string;
  duration_minutes?: number;
}

export interface UpdateQuizInput {
  title?: string;
  description?: string;
  duration_minutes?: number;
  is_published?: boolean;
}

export interface CreateQuestionInput {
  quiz_id: string;
  question_text: string;
  points?: number;
  order_index: number;
  options: CreateOptionInput[];
}

export interface CreateOptionInput {
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface SubmitAnswerInput {
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
}

/**
 * Session/Auth Types
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface SessionData {
  user: SessionUser;
  expiresAt: number;
}

