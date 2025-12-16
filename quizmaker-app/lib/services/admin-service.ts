/**
 * Admin Service
 * 
 * This service handles admin-specific operations including:
 * - Dashboard statistics
 * - System monitoring
 * - User management oversight
 * - Quiz moderation
 */

import 'server-only';
import { D1Database } from '@cloudflare/workers-types';
import {
  executeQuery,
  executeQueryFirst,
  fromBool,
} from '../d1-client';
import {
  DashboardStats,
  UserStats,
  QuizStats,
} from '../types/database';

/**
 * Get dashboard statistics for admin overview
 * 
 * @param db - D1 Database instance
 * @returns Promise resolving to dashboard statistics
 */
export async function getDashboardStats(
  db: D1Database
): Promise<DashboardStats> {
  // Get user counts by role
  const userStats = await executeQuery<{ role: string; count: number }>(
    db,
    `SELECT role, COUNT(*) as count 
     FROM users 
     WHERE is_active = ?
     GROUP BY role`,
    [fromBool(true)]
  );

  const totalStudents = userStats.find(s => s.role === 'student')?.count || 0;
  const totalInstructors = userStats.find(s => s.role === 'instructor')?.count || 0;
  const totalAdmins = userStats.find(s => s.role === 'admin')?.count || 0;
  const totalUsers = totalStudents + totalInstructors + totalAdmins;

  // Get quiz counts
  const quizStats = await executeQueryFirst<{
    total: number;
    published: number;
  }>(
    db,
    `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN is_published = ? THEN 1 ELSE 0 END) as published
     FROM quizzes`,
    [fromBool(true)]
  );

  // Get attempt stats
  const attemptStats = await executeQueryFirst<{
    total_attempts: number;
    completed_attempts: number;
    average_score: number | null;
  }>(
    db,
    `SELECT 
       COUNT(*) as total_attempts,
       SUM(CASE WHEN is_completed = ? THEN 1 ELSE 0 END) as completed_attempts,
       AVG(CASE WHEN is_completed = ? THEN score END) as average_score
     FROM quiz_attempts`,
    [fromBool(true), fromBool(true)]
  );

  return {
    total_users: totalUsers,
    total_students: totalStudents,
    total_instructors: totalInstructors,
    total_admins: totalAdmins,
    total_quizzes: quizStats?.total || 0,
    published_quizzes: quizStats?.published || 0,
    total_attempts: attemptStats?.total_attempts || 0,
    completed_attempts: attemptStats?.completed_attempts || 0,
    average_score: attemptStats?.average_score || null,
  };
}

/**
 * Get detailed user statistics
 * 
 * @param db - D1 Database instance
 * @returns Promise resolving to array of user statistics
 */
export async function getUserStatistics(
  db: D1Database
): Promise<UserStats[]> {
  // Get instructor statistics
  const instructorStats = await executeQuery<UserStats>(
    db,
    `SELECT 
       u.id as user_id,
       u.name as user_name,
       u.email as user_email,
       u.role,
       COUNT(q.id) as total_quizzes_created
     FROM users u
     LEFT JOIN quizzes q ON u.id = q.instructor_id
     WHERE u.role = 'instructor' AND u.is_active = ?
     GROUP BY u.id, u.name, u.email, u.role`,
    [fromBool(true)]
  );

  // Get student statistics
  const studentStats = await executeQuery<UserStats>(
    db,
    `SELECT 
       u.id as user_id,
       u.name as user_name,
       u.email as user_email,
       u.role,
       COUNT(qa.id) as total_attempts,
       AVG(CASE WHEN qa.is_completed = ? THEN qa.score END) as average_score,
       SUM(CASE WHEN qa.is_completed = ? AND qa.score >= 70 THEN 1 ELSE 0 END) as quizzes_passed
     FROM users u
     LEFT JOIN quiz_attempts qa ON u.id = qa.student_id
     WHERE u.role = 'student' AND u.is_active = ?
     GROUP BY u.id, u.name, u.email, u.role`,
    [fromBool(true), fromBool(true), fromBool(true)]
  );

  return [...instructorStats, ...studentStats];
}

/**
 * Get quiz statistics for all quizzes
 * 
 * @param db - D1 Database instance
 * @returns Promise resolving to array of quiz statistics
 */
export async function getQuizStatistics(
  db: D1Database
): Promise<QuizStats[]> {
  return await executeQuery<QuizStats>(
    db,
    `SELECT 
       q.id as quiz_id,
       q.title as quiz_title,
       COUNT(qa.id) as total_attempts,
       SUM(CASE WHEN qa.is_completed = ? THEN 1 ELSE 0 END) as completed_attempts,
       AVG(CASE WHEN qa.is_completed = ? THEN qa.score END) as average_score,
       MAX(CASE WHEN qa.is_completed = ? THEN qa.score END) as highest_score,
       MIN(CASE WHEN qa.is_completed = ? THEN qa.score END) as lowest_score,
       AVG(CASE WHEN qa.is_completed = ? THEN qa.duration_seconds END) as average_duration_seconds
     FROM quizzes q
     LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
     WHERE q.is_published = ?
     GROUP BY q.id, q.title
     ORDER BY total_attempts DESC`,
    [
      fromBool(true),
      fromBool(true),
      fromBool(true),
      fromBool(true),
      fromBool(true),
      fromBool(true),
    ]
  );
}

/**
 * Get recent activity across the system
 * 
 * @param db - D1 Database instance
 * @param limit - Number of activities to return
 * @returns Promise resolving to array of recent activities
 */
export async function getRecentActivity(
  db: D1Database,
  limit: number = 20
): Promise<Array<{
  timestamp: number;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
}>> {
  // Get recent quiz creations
  const quizCreations = await executeQuery<{
    timestamp: number;
    user_id: string;
    user_name: string;
    user_role: string;
    action: string;
    resource_type: string;
    resource_id: string;
    details: string;
  }>(
    db,
    `SELECT 
       q.created_at as timestamp,
       u.id as user_id,
       u.name as user_name,
       u.role as user_role,
       'created' as action,
       'quiz' as resource_type,
       q.id as resource_id,
       q.title as details
     FROM quizzes q
     JOIN users u ON q.instructor_id = u.id
     ORDER BY q.created_at DESC
     LIMIT ?`,
    [limit]
  );

  // Get recent quiz attempts
  const attempts = await executeQuery<{
    timestamp: number;
    user_id: string;
    user_name: string;
    user_role: string;
    action: string;
    resource_type: string;
    resource_id: string;
    details: string;
  }>(
    db,
    `SELECT 
       qa.submitted_at as timestamp,
       u.id as user_id,
       u.name as user_name,
       u.role as user_role,
       'completed' as action,
       'quiz_attempt' as resource_type,
       qa.id as resource_id,
       q.title || ' (Score: ' || CAST(qa.score AS TEXT) || '%)' as details
     FROM quiz_attempts qa
     JOIN users u ON qa.student_id = u.id
     JOIN quizzes q ON qa.quiz_id = q.id
     WHERE qa.is_completed = ?
     ORDER BY qa.submitted_at DESC
     LIMIT ?`,
    [fromBool(true), limit]
  );

  // Get recent user registrations
  const registrations = await executeQuery<{
    timestamp: number;
    user_id: string;
    user_name: string;
    user_role: string;
    action: string;
    resource_type: string;
    resource_id: string;
    details: string;
  }>(
    db,
    `SELECT 
       created_at as timestamp,
       id as user_id,
       name as user_name,
       role as user_role,
       'registered' as action,
       'user' as resource_type,
       id as resource_id,
       email as details
     FROM users
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );

  // Combine and sort all activities
  const allActivities = [...quizCreations, ...attempts, ...registrations];
  allActivities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return allActivities.slice(0, limit);
}

/**
 * Get top performing students
 * 
 * @param db - D1 Database instance
 * @param limit - Number of students to return
 * @returns Promise resolving to array of top students
 */
export async function getTopStudents(
  db: D1Database,
  limit: number = 10
): Promise<Array<{
  student_id: string;
  student_name: string;
  student_email: string;
  total_attempts: number;
  average_score: number;
  quizzes_passed: number;
}>> {
  return await executeQuery<{
    student_id: string;
    student_name: string;
    student_email: string;
    total_attempts: number;
    average_score: number;
    quizzes_passed: number;
  }>(
    db,
    `SELECT 
       u.id as student_id,
       u.name as student_name,
       u.email as student_email,
       COUNT(qa.id) as total_attempts,
       AVG(qa.score) as average_score,
       SUM(CASE WHEN qa.score >= 70 THEN 1 ELSE 0 END) as quizzes_passed
     FROM users u
     JOIN quiz_attempts qa ON u.id = qa.student_id
     WHERE u.role = 'student' AND qa.is_completed = ?
     GROUP BY u.id, u.name, u.email
     HAVING total_attempts >= 3
     ORDER BY average_score DESC, total_attempts DESC
     LIMIT ?`,
    [fromBool(true), limit]
  );
}

/**
 * Get most popular quizzes
 * 
 * @param db - D1 Database instance
 * @param limit - Number of quizzes to return
 * @returns Promise resolving to array of popular quizzes
 */
export async function getPopularQuizzes(
  db: D1Database,
  limit: number = 10
): Promise<Array<{
  quiz_id: string;
  quiz_title: string;
  instructor_name: string;
  total_attempts: number;
  average_score: number;
  completion_rate: number;
}>> {
  return await executeQuery<{
    quiz_id: string;
    quiz_title: string;
    instructor_name: string;
    total_attempts: number;
    average_score: number;
    completion_rate: number;
  }>(
    db,
    `SELECT 
       q.id as quiz_id,
       q.title as quiz_title,
       u.name as instructor_name,
       COUNT(qa.id) as total_attempts,
       AVG(CASE WHEN qa.is_completed = ? THEN qa.score END) as average_score,
       (SUM(CASE WHEN qa.is_completed = ? THEN 1 ELSE 0 END) * 100.0 / COUNT(qa.id)) as completion_rate
     FROM quizzes q
     JOIN users u ON q.instructor_id = u.id
     LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
     WHERE q.is_published = ?
     GROUP BY q.id, q.title, u.name
     HAVING total_attempts > 0
     ORDER BY total_attempts DESC, average_score DESC
     LIMIT ?`,
    [fromBool(true), fromBool(true), fromBool(true), limit]
  );
}

/**
 * Get system health metrics
 * 
 * @param db - D1 Database instance
 * @returns Promise resolving to system health metrics
 */
export async function getSystemHealthMetrics(
  db: D1Database
): Promise<{
  active_users_last_7_days: number;
  quizzes_created_last_7_days: number;
  attempts_last_7_days: number;
  average_completion_rate: number;
  database_size_estimate: number;
}> {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  // Active users (logged in/attempted quiz in last 7 days)
  const activeUsers = await executeQueryFirst<{ count: number }>(
    db,
    `SELECT COUNT(DISTINCT student_id) as count
     FROM quiz_attempts
     WHERE started_at >= ?`,
    [sevenDaysAgo]
  );

  // Quizzes created in last 7 days
  const recentQuizzes = await executeQueryFirst<{ count: number }>(
    db,
    `SELECT COUNT(*) as count
     FROM quizzes
     WHERE created_at >= ?`,
    [sevenDaysAgo]
  );

  // Attempts in last 7 days
  const recentAttempts = await executeQueryFirst<{ count: number }>(
    db,
    `SELECT COUNT(*) as count
     FROM quiz_attempts
     WHERE started_at >= ?`,
    [sevenDaysAgo]
  );

  // Average completion rate
  const completionRate = await executeQueryFirst<{ rate: number }>(
    db,
    `SELECT 
       (SUM(CASE WHEN is_completed = ? THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as rate
     FROM quiz_attempts`,
    [fromBool(true)]
  );

  // Estimate database size (row counts)
  const rowCounts = await executeQuery<{ table_name: string; count: number }>(
    db,
    `SELECT 'users' as table_name, COUNT(*) as count FROM users
     UNION ALL
     SELECT 'quizzes', COUNT(*) FROM quizzes
     UNION ALL
     SELECT 'questions', COUNT(*) FROM questions
     UNION ALL
     SELECT 'answer_options', COUNT(*) FROM answer_options
     UNION ALL
     SELECT 'quiz_attempts', COUNT(*) FROM quiz_attempts
     UNION ALL
     SELECT 'attempt_answers', COUNT(*) FROM attempt_answers`,
    []
  );

  const totalRows = rowCounts.reduce((sum, row) => sum + row.count, 0);

  return {
    active_users_last_7_days: activeUsers?.count || 0,
    quizzes_created_last_7_days: recentQuizzes?.count || 0,
    attempts_last_7_days: recentAttempts?.count || 0,
    average_completion_rate: completionRate?.rate || 0,
    database_size_estimate: totalRows,
  };
}

export default {
  getDashboardStats,
  getUserStatistics,
  getQuizStatistics,
  getRecentActivity,
  getTopStudents,
  getPopularQuizzes,
  getSystemHealthMetrics,
};

