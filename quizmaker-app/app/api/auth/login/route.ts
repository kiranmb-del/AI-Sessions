/**
 * User Login API Route
 * POST /api/auth/login
 * 
 * Handles user authentication and session creation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/d1-client';
import { loginUser } from '@/lib/services/user-service';
import { createSessionCookie } from '@/lib/auth/session';
import { loginSchema } from '@/lib/validations/auth';
import { ZodError } from 'zod';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Get environment and database
    const env = process.env as unknown as { 
      quizmaker_app_database: D1Database;
      SESSION_SECRET?: string;
      NEXTJS_ENV?: string;
    };
    const db = getDatabase(env);

    // Parse request body
    const body = await request.json();

    // Validate input
    const validated = loginSchema.parse(body);

    // Login user
    const { user, token } = await loginUser(
      db,
      validated.email,
      validated.password,
      env
    );

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      data: user,
      message: 'Login successful',
    }, { status: 200 });

    // Set session cookie
    const cookieHeader = createSessionCookie(token, env);
    response.headers.set('Set-Cookie', cookieHeader);

    return response;

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

    // Handle service errors (invalid credentials, inactive account)
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: error.message,
        },
      }, { status: 401 });
    }

    // Handle unknown errors
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }, { status: 500 });
  }
}

