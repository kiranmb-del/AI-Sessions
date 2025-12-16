/**
 * Session Management
 * 
 * This module handles user session creation, validation, and destruction.
 * Sessions are stored in httpOnly cookies for security.
 */

import { SignJWT, jwtVerify } from 'jose';
import { SessionUser, SessionData } from '../types/database';

/**
 * Session configuration
 */
const SESSION_CONFIG = {
  cookieName: 'quiz_session',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  algorithm: 'HS256' as const,
};

/**
 * Get JWT secret key from environment
 * Falls back to a default for development (NEVER use in production)
 */
function getSecretKey(env: { SESSION_SECRET?: string }): Uint8Array {
  const secret = env.SESSION_SECRET || 'dev-secret-key-change-in-production';
  return new TextEncoder().encode(secret);
}

/**
 * Create a session token for a user
 * 
 * @param user - User data to encode in session
 * @param env - Environment with SESSION_SECRET
 * @returns Promise resolving to JWT token string
 */
export async function createSession(
  user: SessionUser,
  env: { SESSION_SECRET?: string }
): Promise<string> {
  const expiresAt = Date.now() + SESSION_CONFIG.maxAge;
  
  const token = await new SignJWT({
    user: user,
    expiresAt: expiresAt,
  })
    .setProtectedHeader({ alg: SESSION_CONFIG.algorithm })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt / 1000)) // JWT expects seconds
    .sign(getSecretKey(env));
  
  return token;
}

/**
 * Verify and decode a session token
 * 
 * @param token - JWT token to verify
 * @param env - Environment with SESSION_SECRET
 * @returns Promise resolving to SessionData if valid, null if invalid
 */
export async function verifySession(
  token: string,
  env: { SESSION_SECRET?: string }
): Promise<SessionData | null> {
  try {
    const verified = await jwtVerify(token, getSecretKey(env));
    const payload = verified.payload as unknown as SessionData;
    
    // Check if session has expired
    if (payload.expiresAt < Date.now()) {
      return null;
    }
    
    return payload;
  } catch (error) {
    // Invalid token or expired
    return null;
  }
}

/**
 * Get session cookie options
 * 
 * @param maxAge - Cookie max age in seconds (0 = delete cookie)
 * @param isProduction - Whether in production environment
 * @returns Cookie options string
 */
export function getSessionCookieOptions(
  maxAge: number,
  isProduction: boolean = false
): string {
  const options = [
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAge}`,
  ];
  
  if (isProduction) {
    options.push('Secure'); // HTTPS only in production
  }
  
  return options.join('; ');
}

/**
 * Create Set-Cookie header for session
 * 
 * @param token - Session token to set
 * @param env - Environment config
 * @returns Set-Cookie header value
 */
export function createSessionCookie(
  token: string,
  env: { NEXTJS_ENV?: string }
): string {
  const isProduction = env.NEXTJS_ENV === 'production';
  const maxAge = Math.floor(SESSION_CONFIG.maxAge / 1000); // Convert to seconds
  const options = getSessionCookieOptions(maxAge, isProduction);
  
  return `${SESSION_CONFIG.cookieName}=${token}; ${options}`;
}

/**
 * Create Set-Cookie header to delete session
 * 
 * @param env - Environment config
 * @returns Set-Cookie header value that deletes the cookie
 */
export function deleteSessionCookie(env: { NEXTJS_ENV?: string }): string {
  const isProduction = env.NEXTJS_ENV === 'production';
  const options = getSessionCookieOptions(0, isProduction);
  
  return `${SESSION_CONFIG.cookieName}=; ${options}`;
}

/**
 * Extract session token from request headers
 * 
 * @param headers - Request headers object
 * @returns Session token if found, null otherwise
 */
export function getSessionToken(headers: Headers): string | null {
  const cookieHeader = headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_CONFIG.cookieName}=`));
  
  if (!sessionCookie) {
    return null;
  }
  
  return sessionCookie.substring(SESSION_CONFIG.cookieName.length + 1);
}

/**
 * Get current user from request
 * 
 * @param request - Request object
 * @param env - Environment with SESSION_SECRET
 * @returns Promise resolving to SessionUser if authenticated, null otherwise
 */
export async function getCurrentUser(
  request: Request,
  env: { SESSION_SECRET?: string }
): Promise<SessionUser | null> {
  const token = getSessionToken(request.headers);
  if (!token) {
    return null;
  }
  
  const session = await verifySession(token, env);
  if (!session) {
    return null;
  }
  
  return session.user;
}

/**
 * Require authentication middleware helper
 * Returns user if authenticated, throws error if not
 * 
 * @param request - Request object
 * @param env - Environment with SESSION_SECRET
 * @returns Promise resolving to SessionUser
 * @throws Error if not authenticated
 */
export async function requireAuth(
  request: Request,
  env: { SESSION_SECRET?: string }
): Promise<SessionUser> {
  const user = await getCurrentUser(request, env);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Require specific role for authorization
 * 
 * @param user - Current user from session
 * @param allowedRoles - Array of roles that have access
 * @throws Error if user doesn't have required role
 */
export function requireRole(
  user: SessionUser,
  allowedRoles: SessionUser['role'][]
): void {
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
  }
}

/**
 * Check if user has specific role
 * 
 * @param user - Current user from session
 * @param role - Role to check
 * @returns True if user has the role
 */
export function hasRole(user: SessionUser, role: SessionUser['role']): boolean {
  return user.role === role;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: SessionUser): boolean {
  return hasRole(user, 'admin');
}

/**
 * Check if user is instructor
 */
export function isInstructor(user: SessionUser): boolean {
  return hasRole(user, 'instructor');
}

/**
 * Check if user is student
 */
export function isStudent(user: SessionUser): boolean {
  return hasRole(user, 'student');
}

