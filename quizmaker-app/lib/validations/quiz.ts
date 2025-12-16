/**
 * Quiz Validation Schemas
 * 
 * Zod schemas for validating quiz-related inputs
 */

import { z } from 'zod';

/**
 * Quiz title validation schema
 */
export const quizTitleSchema = z
  .string()
  .min(3, 'Title must be at least 3 characters')
  .max(255, 'Title must be less than 255 characters')
  .trim();

/**
 * Quiz description validation schema
 */
export const quizDescriptionSchema = z
  .string()
  .max(2000, 'Description must be less than 2000 characters')
  .trim()
  .optional();

/**
 * Quiz duration validation schema
 */
export const quizDurationSchema = z
  .number()
  .int('Duration must be an integer')
  .min(1, 'Duration must be at least 1 minute')
  .max(1440, 'Duration must be less than 24 hours')
  .optional();

/**
 * Create quiz input validation schema
 */
export const createQuizSchema = z.object({
  title: quizTitleSchema,
  description: quizDescriptionSchema,
  duration_minutes: quizDurationSchema,
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;

/**
 * Update quiz input validation schema
 */
export const updateQuizSchema = z.object({
  title: quizTitleSchema.optional(),
  description: quizDescriptionSchema,
  duration_minutes: quizDurationSchema,
  is_published: z.boolean().optional(),
}).refine((data) => {
  // At least one field must be provided
  return data.title || data.description !== undefined || 
         data.duration_minutes !== undefined || data.is_published !== undefined;
}, {
  message: 'At least one field must be provided',
});

export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;

/**
 * Question text validation schema
 */
export const questionTextSchema = z
  .string()
  .min(10, 'Question must be at least 10 characters')
  .max(1000, 'Question must be less than 1000 characters')
  .trim();

/**
 * Question points validation schema
 */
export const questionPointsSchema = z
  .number()
  .int('Points must be an integer')
  .min(1, 'Points must be at least 1')
  .max(100, 'Points must be less than 100');

/**
 * Answer option validation schema
 */
export const answerOptionSchema = z.object({
  option_text: z
    .string()
    .min(1, 'Option text is required')
    .max(500, 'Option text must be less than 500 characters')
    .trim(),
  is_correct: z.boolean(),
  order_index: z.number().int().min(0),
});

export type AnswerOptionInput = z.infer<typeof answerOptionSchema>;

/**
 * Create question input validation schema
 */
export const createQuestionSchema = z.object({
  quiz_id: z.string().uuid('Invalid quiz ID'),
  question_text: questionTextSchema,
  points: questionPointsSchema.default(1),
  order_index: z.number().int().min(0),
  options: z
    .array(answerOptionSchema)
    .min(2, 'Question must have at least 2 options')
    .max(6, 'Question cannot have more than 6 options')
    .refine((options) => {
      // Exactly one option must be marked as correct
      const correctCount = options.filter(opt => opt.is_correct).length;
      return correctCount === 1;
    }, {
      message: 'Exactly one option must be marked as correct',
    }),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

/**
 * Update question input validation schema
 */
export const updateQuestionSchema = z.object({
  question_text: questionTextSchema.optional(),
  points: questionPointsSchema.optional(),
  order_index: z.number().int().min(0).optional(),
}).refine((data) => {
  return data.question_text || data.points || data.order_index !== undefined;
}, {
  message: 'At least one field must be provided',
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

/**
 * Update answer option input validation schema
 */
export const updateOptionSchema = z.object({
  option_text: z
    .string()
    .min(1, 'Option text is required')
    .max(500, 'Option text must be less than 500 characters')
    .trim()
    .optional(),
  is_correct: z.boolean().optional(),
  order_index: z.number().int().min(0).optional(),
}).refine((data) => {
  return data.option_text || data.is_correct !== undefined || data.order_index !== undefined;
}, {
  message: 'At least one field must be provided',
});

export type UpdateOptionInput = z.infer<typeof updateOptionSchema>;

/**
 * Submit answer input validation schema
 */
export const submitAnswerSchema = z.object({
  attempt_id: z.string().uuid('Invalid attempt ID'),
  question_id: z.string().uuid('Invalid question ID'),
  selected_option_id: z.string().uuid('Invalid option ID').nullable(),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

/**
 * Pagination validation schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

