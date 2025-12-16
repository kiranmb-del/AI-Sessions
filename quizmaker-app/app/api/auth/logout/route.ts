/**
 * User Logout API Route
 * POST /api/auth/logout
 * 
 * Handles user logout by clearing session cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteSessionCookie } from '@/lib/auth/session';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const env = process.env as unknown as { NEXTJS_ENV?: string };

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    }, { status: 200 });

    // Delete session cookie
    const cookieHeader = deleteSessionCookie(env);
    response.headers.set('Set-Cookie', cookieHeader);

    return response;

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Failed to logout',
      },
    }, { status: 500 });
  }
}

