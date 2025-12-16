/**
 * Get Current Session API Route
 * GET /api/auth/session
 * 
 * Returns the current user session if authenticated.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const env = process.env as unknown as { SESSION_SECRET?: string };

    // Get current user from session
    const user = await getCurrentUser(request, env);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'No active session',
        },
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: { user },
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'SESSION_ERROR',
        message: 'Failed to retrieve session',
      },
    }, { status: 500 });
  }
}

