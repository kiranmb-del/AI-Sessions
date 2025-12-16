/**
 * Quiz Service
 * 
 * This service handles all quiz-related operations including:
 * - Quiz CRUD operations
 * - Question management
 * - Answer option management
 * - Quiz publishing and unpublishing
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
  Quiz,
  Question,
  AnswerOption,
  QuestionWithOptions,
  QuizComplete,
  QuestionWithPublicOptions,
  AnswerOptionPublic,
} from '../types/database';

/**
 * Create a new quiz
 * 
 * @param db - D1 Database instance
 * @param instructorId - ID of the instructor creating the quiz
 * @param title - Quiz title
 * @param description - Quiz description (optional)
 * @param durationMinutes - Quiz duration in minutes (optional)
 * @returns Promise resolving to created quiz
 */
export async function createQuiz(
  db: D1Database,
  instructorId: string,
  title: string,
  description?: string,
  durationMinutes?: number
): Promise<Quiz> {
  const quizId = generateId();
  const now = getCurrentTimestamp();

  await executeMutation(
    db,
    `INSERT INTO quizzes (id, title, description, instructor_id, is_published, duration_minutes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      quizId,
      title,
      description || null,
      instructorId,
      fromBool(false), // Default to unpublished
      durationMinutes || null,
      now,
      now,
    ]
  );

  const quiz = await executeQueryFirst<Quiz>(
    db,
    'SELECT * FROM quizzes WHERE id = ?',
    [quizId]
  );

  if (!quiz) {
    throw new Error('Failed to create quiz');
  }

  return quiz;
}

/**
 * Get quiz by ID
 * 
 * @param db - D1 Database instance
 * @param quizId - Quiz ID
 * @returns Promise resolving to quiz or null if not found
 */
export async function getQuizById(
  db: D1Database,
  quizId: string
): Promise<Quiz | null> {
  return await executeQueryFirst<Quiz>(
    db,
    'SELECT * FROM quizzes WHERE id = ?',
    [quizId]
  );
}

/**
 * Get complete quiz with all questions and options
 * 
 * @param db - D1 Database instance
 * @param quizId - Quiz ID
 * @param includeCorrectAnswers - Whether to include correct answer flags
 * @returns Promise resolving to complete quiz data or null
 */
export async function getCompleteQuiz(
  db: D1Database,
  quizId: string,
  includeCorrectAnswers: boolean = true
): Promise<QuizComplete | null> {
  const quiz = await getQuizById(db, quizId);
  if (!quiz) {
    return null;
  }

  // Get all questions for the quiz
  const questions = await executeQuery<Question>(
    db,
    'SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index ASC',
    [quizId]
  );

  // Get all options for all questions
  const questionsWithOptions: QuestionWithOptions[] = [];
  let totalPoints = 0;

  for (const question of questions) {
    const options = await executeQuery<AnswerOption>(
      db,
      'SELECT * FROM answer_options WHERE question_id = ? ORDER BY order_index ASC',
      [question.id]
    );

    questionsWithOptions.push({
      ...question,
      options,
    });

    totalPoints += question.points;
  }

  return {
    ...quiz,
    questions: questionsWithOptions,
    total_questions: questions.length,
    total_points: totalPoints,
  };
}

/**
 * Get quiz for student (without correct answer indicators)
 * 
 * @param db - D1 Database instance
 * @param quizId - Quiz ID
 * @returns Promise resolving to quiz with public options
 */
export async function getQuizForStudent(
  db: D1Database,
  quizId: string
): Promise<{ quiz: Quiz; questions: QuestionWithPublicOptions[] } | null> {
  const quiz = await getQuizById(db, quizId);
  if (!quiz) {
    return null;
  }

  // Only return published quizzes for students
  if (!toBool(quiz.is_published)) {
    return null;
  }

  const questions = await executeQuery<Question>(
    db,
    'SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index ASC',
    [quizId]
  );

  const questionsWithPublicOptions: QuestionWithPublicOptions[] = [];

  for (const question of questions) {
    const options = await executeQuery<AnswerOption>(
      db,
      'SELECT id, question_id, option_text, order_index FROM answer_options WHERE question_id = ? ORDER BY order_index ASC',
      [question.id]
    );

    questionsWithPublicOptions.push({
      ...question,
      options: options as AnswerOptionPublic[],
    });
  }

  return {
    quiz,
    questions: questionsWithPublicOptions,
  };
}

/**
 * List quizzes with filters
 * 
 * @param db - D1 Database instance
 * @param filters - Optional filters
 * @returns Promise resolving to array of quizzes
 */
export async function listQuizzes(
  db: D1Database,
  filters?: {
    instructor_id?: string;
    is_published?: boolean;
  }
): Promise<Quiz[]> {
  let sql = 'SELECT * FROM quizzes WHERE 1=1';
  const params: unknown[] = [];

  if (filters?.instructor_id) {
    sql += ' AND instructor_id = ?';
    params.push(filters.instructor_id);
  }

  if (filters?.is_published !== undefined) {
    sql += ' AND is_published = ?';
    params.push(fromBool(filters.is_published));
  }

  sql += ' ORDER BY created_at DESC';

  return await executeQuery<Quiz>(db, sql, params);
}

/**
 * Update quiz
 * 
 * @param db - D1 Database instance
 * @param quizId - Quiz ID
 * @param instructorId - ID of instructor (for ownership check)
 * @param updates - Fields to update
 * @returns Promise resolving to updated quiz
 * @throws Error if quiz not found or not owned by instructor
 */
export async function updateQuiz(
  db: D1Database,
  quizId: string,
  instructorId: string,
  updates: {
    title?: string;
    description?: string;
    duration_minutes?: number;
    is_published?: boolean;
  }
): Promise<Quiz> {
  // Check ownership
  const existingQuiz = await executeQueryFirst<Quiz>(
    db,
    'SELECT * FROM quizzes WHERE id = ? AND instructor_id = ?',
    [quizId, instructorId]
  );

  if (!existingQuiz) {
    throw new Error('Quiz not found or access denied');
  }

  // Build update query
  const setClauses: string[] = [];
  const params: unknown[] = [];

  if (updates.title !== undefined) {
    setClauses.push('title = ?');
    params.push(updates.title);
  }

  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    params.push(updates.description || null);
  }

  if (updates.duration_minutes !== undefined) {
    setClauses.push('duration_minutes = ?');
    params.push(updates.duration_minutes || null);
  }

  if (updates.is_published !== undefined) {
    setClauses.push('is_published = ?');
    params.push(fromBool(updates.is_published));
  }

  setClauses.push('updated_at = ?');
  params.push(getCurrentTimestamp());

  params.push(quizId);

  await executeMutation(
    db,
    `UPDATE quizzes SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );

  const quiz = await executeQueryFirst<Quiz>(
    db,
    'SELECT * FROM quizzes WHERE id = ?',
    [quizId]
  );

  if (!quiz) {
    throw new Error('Failed to update quiz');
  }

  return quiz;
}

/**
 * Publish quiz (make visible to students)
 * 
 * @param db - D1 Database instance
 * @param quizId - Quiz ID
 * @param instructorId - ID of instructor (for ownership check)
 * @returns Promise resolving to updated quiz
 * @throws Error if quiz has no questions
 */
export async function publishQuiz(
  db: D1Database,
  quizId: string,
  instructorId: string
): Promise<Quiz> {
  // Check if quiz has at least one question
  const questionCount = await executeQueryFirst<{ count: number }>(
    db,
    'SELECT COUNT(*) as count FROM questions WHERE quiz_id = ?',
    [quizId]
  );

  if (!questionCount || questionCount.count === 0) {
    throw new Error('Cannot publish quiz without questions');
  }

  return await updateQuiz(db, quizId, instructorId, { is_published: true });
}

/**
 * Unpublish quiz (hide from students)
 * 
 * @param db - D1 Database instance
 * @param quizId - Quiz ID
 * @param instructorId - ID of instructor (for ownership check)
 * @returns Promise resolving to updated quiz
 */
export async function unpublishQuiz(
  db: D1Database,
  quizId: string,
  instructorId: string
): Promise<Quiz> {
  return await updateQuiz(db, quizId, instructorId, { is_published: false });
}

/**
 * Delete quiz
 * Cascades to questions, options, and attempts
 * 
 * @param db - D1 Database instance
 * @param quizId - Quiz ID
 * @param instructorId - ID of instructor (for ownership check)
 * @throws Error if quiz not found or not owned by instructor
 */
export async function deleteQuiz(
  db: D1Database,
  quizId: string,
  instructorId: string
): Promise<void> {
  const result = await executeMutation(
    db,
    'DELETE FROM quizzes WHERE id = ? AND instructor_id = ?',
    [quizId, instructorId]
  );

  if (result.meta && result.meta.changes === 0) {
    throw new Error('Quiz not found or access denied');
  }
}

/**
 * Add question to quiz
 * 
 * @param db - D1 Database instance
 * @param quizId - Quiz ID
 * @param questionText - Question text
 * @param points - Points for correct answer
 * @param orderIndex - Display order
 * @param options - Answer options
 * @returns Promise resolving to created question with options
 */
export async function addQuestion(
  db: D1Database,
  quizId: string,
  questionText: string,
  points: number,
  orderIndex: number,
  options: Array<{ option_text: string; is_correct: boolean; order_index: number }>
): Promise<QuestionWithOptions> {
  // Validate options
  if (options.length < 2) {
    throw new Error('Question must have at least 2 options');
  }

  const correctCount = options.filter(opt => opt.is_correct).length;
  if (correctCount !== 1) {
    throw new Error('Exactly one option must be marked as correct');
  }

  const questionId = generateId();
  const now = getCurrentTimestamp();

  // Prepare batch statements
  const statements = [
    {
      sql: 'INSERT INTO questions (id, quiz_id, question_text, points, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      params: [questionId, quizId, questionText, points, orderIndex, now, now],
    },
  ];

  // Add option insert statements
  for (const option of options) {
    const optionId = generateId();
    statements.push({
      sql: 'INSERT INTO answer_options (id, question_id, option_text, is_correct, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      params: [
        optionId,
        questionId,
        option.option_text,
        fromBool(option.is_correct),
        option.order_index,
        now,
      ],
    });
  }

  // Execute batch
  await executeBatch(db, statements);

  // Retrieve created question with options
  const question = await executeQueryFirst<Question>(
    db,
    'SELECT * FROM questions WHERE id = ?',
    [questionId]
  );

  if (!question) {
    throw new Error('Failed to create question');
  }

  const createdOptions = await executeQuery<AnswerOption>(
    db,
    'SELECT * FROM answer_options WHERE question_id = ? ORDER BY order_index ASC',
    [questionId]
  );

  return {
    ...question,
    options: createdOptions,
  };
}

/**
 * Update question
 * 
 * @param db - D1 Database instance
 * @param questionId - Question ID
 * @param updates - Fields to update
 * @returns Promise resolving to updated question
 */
export async function updateQuestion(
  db: D1Database,
  questionId: string,
  updates: {
    question_text?: string;
    points?: number;
    order_index?: number;
  }
): Promise<Question> {
  const setClauses: string[] = [];
  const params: unknown[] = [];

  if (updates.question_text !== undefined) {
    setClauses.push('question_text = ?');
    params.push(updates.question_text);
  }

  if (updates.points !== undefined) {
    setClauses.push('points = ?');
    params.push(updates.points);
  }

  if (updates.order_index !== undefined) {
    setClauses.push('order_index = ?');
    params.push(updates.order_index);
  }

  setClauses.push('updated_at = ?');
  params.push(getCurrentTimestamp());

  params.push(questionId);

  await executeMutation(
    db,
    `UPDATE questions SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );

  const question = await executeQueryFirst<Question>(
    db,
    'SELECT * FROM questions WHERE id = ?',
    [questionId]
  );

  if (!question) {
    throw new Error('Question not found');
  }

  return question;
}

/**
 * Delete question
 * Cascades to options and attempt answers
 * 
 * @param db - D1 Database instance
 * @param questionId - Question ID
 */
export async function deleteQuestion(
  db: D1Database,
  questionId: string
): Promise<void> {
  const result = await executeMutation(
    db,
    'DELETE FROM questions WHERE id = ?',
    [questionId]
  );

  if (result.meta && result.meta.changes === 0) {
    throw new Error('Question not found');
  }
}

/**
 * Update answer option
 * 
 * @param db - D1 Database instance
 * @param optionId - Option ID
 * @param updates - Fields to update
 * @returns Promise resolving to updated option
 */
export async function updateOption(
  db: D1Database,
  optionId: string,
  updates: {
    option_text?: string;
    is_correct?: boolean;
    order_index?: number;
  }
): Promise<AnswerOption> {
  const setClauses: string[] = [];
  const params: unknown[] = [];

  if (updates.option_text !== undefined) {
    setClauses.push('option_text = ?');
    params.push(updates.option_text);
  }

  if (updates.is_correct !== undefined) {
    setClauses.push('is_correct = ?');
    params.push(fromBool(updates.is_correct));
  }

  if (updates.order_index !== undefined) {
    setClauses.push('order_index = ?');
    params.push(updates.order_index);
  }

  params.push(optionId);

  await executeMutation(
    db,
    `UPDATE answer_options SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );

  const option = await executeQueryFirst<AnswerOption>(
    db,
    'SELECT * FROM answer_options WHERE id = ?',
    [optionId]
  );

  if (!option) {
    throw new Error('Option not found');
  }

  return option;
}

/**
 * Delete answer option
 * 
 * @param db - D1 Database instance
 * @param optionId - Option ID
 * @throws Error if question would have less than 2 options
 */
export async function deleteOption(
  db: D1Database,
  optionId: string
): Promise<void> {
  // Get option to check question
  const option = await executeQueryFirst<AnswerOption>(
    db,
    'SELECT * FROM answer_options WHERE id = ?',
    [optionId]
  );

  if (!option) {
    throw new Error('Option not found');
  }

  // Check remaining option count
  const optionCount = await executeQueryFirst<{ count: number }>(
    db,
    'SELECT COUNT(*) as count FROM answer_options WHERE question_id = ?',
    [option.question_id]
  );

  if (optionCount && optionCount.count <= 2) {
    throw new Error('Cannot delete option. Question must have at least 2 options');
  }

  await executeMutation(
    db,
    'DELETE FROM answer_options WHERE id = ?',
    [optionId]
  );
}

export default {
  createQuiz,
  getQuizById,
  getCompleteQuiz,
  getQuizForStudent,
  listQuizzes,
  updateQuiz,
  publishQuiz,
  unpublishQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  updateOption,
  deleteOption,
};

