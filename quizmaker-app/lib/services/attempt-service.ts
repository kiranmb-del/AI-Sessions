/**
 * Quiz Attempt Service
 * 
 * This service handles quiz attempt operations including:
 * - Starting quiz attempts
 * - Submitting answers
 * - Calculating scores
 * - Retrieving attempt history
 */

import 'server-only';
import { D1Database } from '@cloudflare/workers-types';
import {
  executeQuery,
  executeQueryFirst,
  executeMutation,
  executeBatch,
  generateId,
  getCurrentTimestamp,
  toBool,
  fromBool,
} from '../d1-client';
import {
  QuizAttempt,
  AttemptAnswer,
  QuizAttemptComplete,
  AttemptAnswerWithDetails,
  QuizAttemptWithDetails,
} from '../types/database';

/**
 * Start a new quiz attempt
 * 
 * @param db - D1 Database instance
 * @param studentId - ID of student taking quiz
 * @param quizId - ID of quiz to attempt
 * @returns Promise resolving to created attempt
 * @throws Error if quiz not published or student has incomplete attempt
 */
export async function startQuizAttempt(
  db: D1Database,
  studentId: string,
  quizId: string
): Promise<QuizAttempt> {
  // Check if quiz exists and is published
  const quiz = await executeQueryFirst<{ id: string; is_published: number }>(
    db,
    'SELECT id, is_published FROM quizzes WHERE id = ?',
    [quizId]
  );

  if (!quiz) {
    throw new Error('Quiz not found');
  }

  if (!toBool(quiz.is_published)) {
    throw new Error('Quiz is not published');
  }

  // Check for incomplete attempts
  const incompleteAttempt = await executeQueryFirst<QuizAttempt>(
    db,
    'SELECT * FROM quiz_attempts WHERE student_id = ? AND quiz_id = ? AND is_completed = ?',
    [studentId, quizId, fromBool(false)]
  );

  if (incompleteAttempt) {
    throw new Error('You have an incomplete attempt for this quiz. Please complete or abandon it first.');
  }

  // Create new attempt
  const attemptId = generateId();
  const now = getCurrentTimestamp();

  await executeMutation(
    db,
    `INSERT INTO quiz_attempts (id, student_id, quiz_id, score, points_earned, total_points, started_at, submitted_at, duration_seconds, is_completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [attemptId, studentId, quizId, null, null, null, now, null, null, fromBool(false)]
  );

  const attempt = await executeQueryFirst<QuizAttempt>(
    db,
    'SELECT * FROM quiz_attempts WHERE id = ?',
    [attemptId]
  );

  if (!attempt) {
    throw new Error('Failed to create quiz attempt');
  }

  return attempt;
}

/**
 * Get quiz attempt by ID
 * 
 * @param db - D1 Database instance
 * @param attemptId - Attempt ID
 * @returns Promise resolving to attempt or null if not found
 */
export async function getAttemptById(
  db: D1Database,
  attemptId: string
): Promise<QuizAttempt | null> {
  return await executeQueryFirst<QuizAttempt>(
    db,
    'SELECT * FROM quiz_attempts WHERE id = ?',
    [attemptId]
  );
}

/**
 * Submit answer for a question in an attempt
 * 
 * @param db - D1 Database instance
 * @param attemptId - Attempt ID
 * @param questionId - Question ID
 * @param selectedOptionId - Selected option ID (null if skipped)
 * @returns Promise resolving to created/updated answer
 * @throws Error if attempt is completed or question/option invalid
 */
export async function submitAnswer(
  db: D1Database,
  attemptId: string,
  questionId: string,
  selectedOptionId: string | null
): Promise<AttemptAnswer> {
  // Check if attempt exists and is not completed
  const attempt = await executeQueryFirst<QuizAttempt>(
    db,
    'SELECT * FROM quiz_attempts WHERE id = ?',
    [attemptId]
  );

  if (!attempt) {
    throw new Error('Attempt not found');
  }

  if (toBool(attempt.is_completed)) {
    throw new Error('Cannot modify answers for completed attempt');
  }

  // Verify question belongs to quiz
  const question = await executeQueryFirst<{ id: string; quiz_id: string; points: number }>(
    db,
    'SELECT id, quiz_id, points FROM questions WHERE id = ?',
    [questionId]
  );

  if (!question || question.quiz_id !== attempt.quiz_id) {
    throw new Error('Question not found or does not belong to this quiz');
  }

  // If option selected, verify it belongs to question
  let isCorrect = false;
  let pointsEarned = 0;

  if (selectedOptionId) {
    const option = await executeQueryFirst<{ id: string; question_id: string; is_correct: number }>(
      db,
      'SELECT id, question_id, is_correct FROM answer_options WHERE id = ?',
      [selectedOptionId]
    );

    if (!option || option.question_id !== questionId) {
      throw new Error('Option not found or does not belong to this question');
    }

    isCorrect = toBool(option.is_correct);
    pointsEarned = isCorrect ? question.points : 0;
  }

  // Check if answer already exists
  const existingAnswer = await executeQueryFirst<AttemptAnswer>(
    db,
    'SELECT * FROM attempt_answers WHERE attempt_id = ? AND question_id = ?',
    [attemptId, questionId]
  );

  const now = getCurrentTimestamp();

  if (existingAnswer) {
    // Update existing answer
    await executeMutation(
      db,
      `UPDATE attempt_answers 
       SET selected_option_id = ?, is_correct = ?, points_earned = ?, answered_at = ?
       WHERE id = ?`,
      [selectedOptionId, fromBool(isCorrect), pointsEarned, now, existingAnswer.id]
    );
  } else {
    // Insert new answer
    const answerId = generateId();
    await executeMutation(
      db,
      `INSERT INTO attempt_answers (id, attempt_id, question_id, selected_option_id, is_correct, points_earned, answered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [answerId, attemptId, questionId, selectedOptionId, fromBool(isCorrect), pointsEarned, now]
    );
  }

  const answer = await executeQueryFirst<AttemptAnswer>(
    db,
    'SELECT * FROM attempt_answers WHERE attempt_id = ? AND question_id = ?',
    [attemptId, questionId]
  );

  if (!answer) {
    throw new Error('Failed to save answer');
  }

  return answer;
}

/**
 * Submit quiz attempt (finalize and calculate score)
 * 
 * @param db - D1 Database instance
 * @param attemptId - Attempt ID
 * @param studentId - Student ID (for ownership verification)
 * @returns Promise resolving to completed attempt with results
 * @throws Error if attempt not found or already completed
 */
export async function submitQuizAttempt(
  db: D1Database,
  attemptId: string,
  studentId: string
): Promise<QuizAttemptComplete> {
  // Get attempt
  const attempt = await executeQueryFirst<QuizAttempt>(
    db,
    'SELECT * FROM quiz_attempts WHERE id = ? AND student_id = ?',
    [attemptId, studentId]
  );

  if (!attempt) {
    throw new Error('Attempt not found or access denied');
  }

  if (toBool(attempt.is_completed)) {
    throw new Error('Attempt already completed');
  }

  // Calculate total points and earned points
  const scoreData = await executeQueryFirst<{
    total_points: number;
    points_earned: number;
  }>(
    db,
    `SELECT 
       COALESCE(SUM(q.points), 0) as total_points,
       COALESCE(SUM(aa.points_earned), 0) as points_earned
     FROM questions q
     LEFT JOIN attempt_answers aa ON q.id = aa.question_id AND aa.attempt_id = ?
     WHERE q.quiz_id = ?`,
    [attemptId, attempt.quiz_id]
  );

  const totalPoints = scoreData?.total_points || 0;
  const pointsEarned = scoreData?.points_earned || 0;
  const score = totalPoints > 0 ? (pointsEarned / totalPoints) * 100 : 0;

  // Calculate duration
  const submittedAt = getCurrentTimestamp();
  const durationSeconds = Math.floor((submittedAt - attempt.started_at) / 1000);

  // Update attempt
  await executeMutation(
    db,
    `UPDATE quiz_attempts 
     SET score = ?, points_earned = ?, total_points = ?, submitted_at = ?, duration_seconds = ?, is_completed = ?
     WHERE id = ?`,
    [score, pointsEarned, totalPoints, submittedAt, durationSeconds, fromBool(true), attemptId]
  );

  // Get complete attempt with answers
  return await getCompleteAttempt(db, attemptId, studentId);
}

/**
 * Get complete attempt with all answers and details
 * 
 * @param db - D1 Database instance
 * @param attemptId - Attempt ID
 * @param studentId - Student ID (for ownership verification)
 * @returns Promise resolving to complete attempt data
 */
export async function getCompleteAttempt(
  db: D1Database,
  attemptId: string,
  studentId: string
): Promise<QuizAttemptComplete> {
  const attempt = await executeQueryFirst<QuizAttempt>(
    db,
    'SELECT * FROM quiz_attempts WHERE id = ? AND student_id = ?',
    [attemptId, studentId]
  );

  if (!attempt) {
    throw new Error('Attempt not found or access denied');
  }

  // Get quiz info
  const quiz = await executeQueryFirst<{ title: string; description: string | null }>(
    db,
    'SELECT title, description FROM quizzes WHERE id = ?',
    [attempt.quiz_id]
  );

  // Get all answers with details
  const answers = await executeQuery<AttemptAnswerWithDetails>(
    db,
    `SELECT 
       aa.*,
       q.question_text,
       q.points as question_points,
       selected_opt.option_text as selected_option_text,
       correct_opt.id as correct_option_id,
       correct_opt.option_text as correct_option_text
     FROM attempt_answers aa
     JOIN questions q ON aa.question_id = q.id
     LEFT JOIN answer_options selected_opt ON aa.selected_option_id = selected_opt.id
     JOIN answer_options correct_opt ON q.id = correct_opt.question_id AND correct_opt.is_correct = 1
     WHERE aa.attempt_id = ?
     ORDER BY q.order_index ASC`,
    [attemptId]
  );

  return {
    ...attempt,
    quiz_title: quiz?.title || '',
    quiz_description: quiz?.description || null,
    answers,
  };
}

/**
 * Get student's attempt history for a quiz
 * 
 * @param db - D1 Database instance
 * @param studentId - Student ID
 * @param quizId - Quiz ID (optional, if not provided returns all attempts)
 * @returns Promise resolving to array of attempts
 */
export async function getStudentAttempts(
  db: D1Database,
  studentId: string,
  quizId?: string
): Promise<QuizAttemptWithDetails[]> {
  let sql = `
    SELECT 
      qa.*,
      u.name as student_name,
      u.email as student_email,
      q.title as quiz_title,
      q.description as quiz_description
    FROM quiz_attempts qa
    JOIN users u ON qa.student_id = u.id
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.student_id = ?
  `;

  const params: unknown[] = [studentId];

  if (quizId) {
    sql += ' AND qa.quiz_id = ?';
    params.push(quizId);
  }

  sql += ' ORDER BY qa.started_at DESC';

  return await executeQuery<QuizAttemptWithDetails>(db, sql, params);
}

/**
 * Get all attempts for a quiz (instructor/admin view)
 * 
 * @param db - D1 Database instance
 * @param quizId - Quiz ID
 * @returns Promise resolving to array of attempts with student info
 */
export async function getQuizAttempts(
  db: D1Database,
  quizId: string
): Promise<QuizAttemptWithDetails[]> {
  return await executeQuery<QuizAttemptWithDetails>(
    db,
    `SELECT 
       qa.*,
       u.name as student_name,
       u.email as student_email,
       q.title as quiz_title,
       q.description as quiz_description
     FROM quiz_attempts qa
     JOIN users u ON qa.student_id = u.id
     JOIN quizzes q ON qa.quiz_id = q.id
     WHERE qa.quiz_id = ? AND qa.is_completed = ?
     ORDER BY qa.submitted_at DESC`,
    [quizId, fromBool(true)]
  );
}

/**
 * Get quiz statistics
 * 
 * @param db - D1 Database instance
 * @param quizId - Quiz ID
 * @returns Promise resolving to quiz statistics
 */
export async function getQuizStatistics(
  db: D1Database,
  quizId: string
): Promise<{
  total_attempts: number;
  completed_attempts: number;
  average_score: number | null;
  highest_score: number | null;
  lowest_score: number | null;
  average_duration_seconds: number | null;
}> {
  const stats = await executeQueryFirst<{
    total_attempts: number;
    completed_attempts: number;
    average_score: number | null;
    highest_score: number | null;
    lowest_score: number | null;
    average_duration_seconds: number | null;
  }>(
    db,
    `SELECT 
       COUNT(*) as total_attempts,
       SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_attempts,
       AVG(CASE WHEN is_completed = 1 THEN score END) as average_score,
       MAX(CASE WHEN is_completed = 1 THEN score END) as highest_score,
       MIN(CASE WHEN is_completed = 1 THEN score END) as lowest_score,
       AVG(CASE WHEN is_completed = 1 THEN duration_seconds END) as average_duration_seconds
     FROM quiz_attempts
     WHERE quiz_id = ?`,
    [quizId]
  );

  return stats || {
    total_attempts: 0,
    completed_attempts: 0,
    average_score: null,
    highest_score: null,
    lowest_score: null,
    average_duration_seconds: null,
  };
}

/**
 * Delete incomplete attempt (abandon quiz)
 * 
 * @param db - D1 Database instance
 * @param attemptId - Attempt ID
 * @param studentId - Student ID (for ownership verification)
 */
export async function abandonAttempt(
  db: D1Database,
  attemptId: string,
  studentId: string
): Promise<void> {
  const attempt = await executeQueryFirst<QuizAttempt>(
    db,
    'SELECT * FROM quiz_attempts WHERE id = ? AND student_id = ?',
    [attemptId, studentId]
  );

  if (!attempt) {
    throw new Error('Attempt not found or access denied');
  }

  if (toBool(attempt.is_completed)) {
    throw new Error('Cannot abandon completed attempt');
  }

  await executeMutation(
    db,
    'DELETE FROM quiz_attempts WHERE id = ?',
    [attemptId]
  );
}

/**
 * Get leaderboard for a quiz
 * 
 * @param db - D1 Database instance
 * @param quizId - Quiz ID
 * @param limit - Number of top scores to return (default: 10)
 * @returns Promise resolving to array of top attempts
 */
export async function getQuizLeaderboard(
  db: D1Database,
  quizId: string,
  limit: number = 10
): Promise<Array<{
  student_id: string;
  student_name: string;
  score: number;
  duration_seconds: number;
  submitted_at: number;
}>> {
  return await executeQuery<{
    student_id: string;
    student_name: string;
    score: number;
    duration_seconds: number;
    submitted_at: number;
  }>(
    db,
    `SELECT 
       qa.student_id,
       u.name as student_name,
       qa.score,
       qa.duration_seconds,
       qa.submitted_at
     FROM quiz_attempts qa
     JOIN users u ON qa.student_id = u.id
     WHERE qa.quiz_id = ? AND qa.is_completed = ?
     ORDER BY qa.score DESC, qa.duration_seconds ASC
     LIMIT ?`,
    [quizId, fromBool(true), limit]
  );
}

export default {
  startQuizAttempt,
  getAttemptById,
  submitAnswer,
  submitQuizAttempt,
  getCompleteAttempt,
  getStudentAttempts,
  getQuizAttempts,
  getQuizStatistics,
  abandonAttempt,
  getQuizLeaderboard,
};

