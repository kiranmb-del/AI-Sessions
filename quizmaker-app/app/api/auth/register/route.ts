/**
 * User Registration API Route
 * POST /api/auth/register
 * 
 * Handles new user registration with email and password.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/d1-client';
import { registerUser } from '@/lib/services/user-service';
import { registerSchema } from '@/lib/validations/auth';
import { ZodError } from 'zod';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Get environment and database
    const env = process.env as unknown as { 
      quizmaker_app_database: D1Database; 
    };
    const db = getDatabase(env);

    // Parse request body
    const body = await request.json();

    // Validate input
    const validated = registerSchema.parse(body);

    // Register user
    const user = await registerUser(
      db,
      validated.email,
      validated.password,
      validated.name
    );

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Registration successful',
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

    // Handle service errors
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error.message,
        },
      }, { status: 400 });
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

