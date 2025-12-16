/**
 * Quiz List/Create API Routes
 * GET /api/quizzes - List quizzes (filtered by role)
 * POST /api/quizzes - Create quiz (instructor only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/d1-client';
import { requireAuth, requireRole } from '@/lib/auth/session';
import { createQuiz, listQuizzes } from '@/lib/services/quiz-service';
import { createQuizSchema } from '@/lib/validations/quiz';
import { ZodError } from 'zod';

export const runtime = 'edge';

/**
 * GET /api/quizzes
 * List quizzes based on user role:
 * - Students: Only published quizzes
 * - Instructors: Their own quizzes (all statuses)
 * - Admins: All quizzes
 */
export async function GET(request: NextRequest) {
  try {
    const env = process.env as unknown as { 
      quizmaker_app_database: D1Database;
      SESSION_SECRET?: string;
    };
    const db = getDatabase(env);

    // Authenticate user
    const user = await requireAuth(request, env);

    let quizzes;

    if (user.role === 'student') {
      // Students see only published quizzes
      quizzes = await listQuizzes(db, { is_published: true });
    } else if (user.role === 'instructor') {
      // Instructors see their own quizzes
      quizzes = await listQuizzes(db, { instructor_id: user.id });
    } else {
      // Admins see all quizzes
      quizzes = await listQuizzes(db);
    }

    return NextResponse.json({
      success: true,
      data: quizzes,
    }, { status: 200 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required',
        },
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve quizzes',
      },
    }, { status: 500 });
  }
}

/**
 * POST /api/quizzes
 * Create a new quiz (instructor and admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const env = process.env as unknown as { 
      quizmaker_app_database: D1Database;
      SESSION_SECRET?: string;
    };
    const db = getDatabase(env);

    // Authenticate and authorize
    const user = await requireAuth(request, env);
    requireRole(user, ['instructor', 'admin']);

    // Parse and validate input
    const body = await request.json();
    const validated = createQuizSchema.parse(body);

    // Create quiz
    const quiz = await createQuiz(
      db,
      user.id,
      validated.title,
      validated.description,
      validated.duration_minutes
    );

    return NextResponse.json({
      success: true,
      data: quiz,
      message: 'Quiz created successfully',
    }, { status: 201 });

  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        },
      }, { status: 400 });
    }

    // Handle authorization errors
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Authentication required',
          },
        }, { status: 401 });
      }

      if (error.message.includes('Access denied')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create quiz',
      },
    }, { status: 500 });
  }
}

