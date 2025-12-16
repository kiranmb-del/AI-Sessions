/**
 * User Service
 * 
 * This service handles all user-related operations including:
 * - User registration and authentication
 * - User profile management
 * - Role management (admin only)
 * - User retrieval and listing
 */

import 'server-only';
import { D1Database } from '@cloudflare/workers-types';
import {
  executeQuery,
  executeQueryFirst,
  executeMutation,
  generateId,
  getCurrentTimestamp,
  toBool,
  fromBool,
} from '../d1-client';
import { hashPassword, verifyPassword } from '../auth/password';
import { createSession } from '../auth/session';
import {
  User,
  UserPublic,
  UserRole,
  SessionUser,
} from '../types/database';

/**
 * Convert database User to public UserPublic (removes sensitive data)
 */
function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    is_active: toBool(user.is_active),
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

/**
 * Convert database User to SessionUser
 */
function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/**
 * Register a new user
 * 
 * @param db - D1 Database instance
 * @param email - User email (must be unique)
 * @param password - Plain text password (will be hashed)
 * @param name - User full name
 * @param role - User role (default: 'student')
 * @returns Promise resolving to public user data
 * @throws Error if email already exists or validation fails
 */
export async function registerUser(
  db: D1Database,
  email: string,
  password: string,
  name: string,
  role: UserRole = 'student'
): Promise<UserPublic> {
  // Check if email already exists
  const existingUser = await executeQueryFirst<User>(
    db,
    'SELECT id FROM users WHERE email = ?',
    [email.toLowerCase()]
  );

  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const userId = generateId();
  const now = getCurrentTimestamp();

  await executeMutation(
    db,
    `INSERT INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, email.toLowerCase(), passwordHash, name, role, fromBool(true), now, now]
  );

  // Retrieve created user
  const user = await executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    throw new Error('Failed to create user');
  }

  return toPublicUser(user);
}

/**
 * Authenticate user with email and password
 * 
 * @param db - D1 Database instance
 * @param email - User email
 * @param password - Plain text password
 * @param env - Environment for session creation
 * @returns Promise resolving to session token and user data
 * @throws Error if credentials are invalid or user is inactive
 */
export async function loginUser(
  db: D1Database,
  email: string,
  password: string,
  env: { SESSION_SECRET?: string }
): Promise<{ user: UserPublic; token: string }> {
  // Find user by email
  const user = await executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE email = ?',
    [email.toLowerCase()]
  );

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user is active
  if (!toBool(user.is_active)) {
    throw new Error('Account is deactivated. Please contact support.');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Create session token
  const sessionUser = toSessionUser(user);
  const token = await createSession(sessionUser, env);

  return {
    user: toPublicUser(user),
    token,
  };
}

/**
 * Get user by ID
 * 
 * @param db - D1 Database instance
 * @param userId - User ID
 * @returns Promise resolving to public user data or null if not found
 */
export async function getUserById(
  db: D1Database,
  userId: string
): Promise<UserPublic | null> {
  const user = await executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    return null;
  }

  return toPublicUser(user);
}

/**
 * Get user by email
 * 
 * @param db - D1 Database instance
 * @param email - User email
 * @returns Promise resolving to public user data or null if not found
 */
export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<UserPublic | null> {
  const user = await executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE email = ?',
    [email.toLowerCase()]
  );

  if (!user) {
    return null;
  }

  return toPublicUser(user);
}

/**
 * List all users (admin only)
 * 
 * @param db - D1 Database instance
 * @param filters - Optional filters (role, is_active)
 * @returns Promise resolving to array of public user data
 */
export async function listUsers(
  db: D1Database,
  filters?: {
    role?: UserRole;
    is_active?: boolean;
  }
): Promise<UserPublic[]> {
  let sql = 'SELECT * FROM users WHERE 1=1';
  const params: unknown[] = [];

  if (filters?.role) {
    sql += ' AND role = ?';
    params.push(filters.role);
  }

  if (filters?.is_active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(fromBool(filters.is_active));
  }

  sql += ' ORDER BY created_at DESC';

  const users = await executeQuery<User>(db, sql, params);
  return users.map(toPublicUser);
}

/**
 * Update user profile
 * 
 * @param db - D1 Database instance
 * @param userId - User ID
 * @param updates - Fields to update
 * @returns Promise resolving to updated public user data
 * @throws Error if user not found
 */
export async function updateUser(
  db: D1Database,
  userId: string,
  updates: {
    name?: string;
    email?: string;
  }
): Promise<UserPublic> {
  // Check if user exists
  const existingUser = await executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (!existingUser) {
    throw new Error('User not found');
  }

  // If email is being updated, check uniqueness
  if (updates.email && updates.email.toLowerCase() !== existingUser.email) {
    const emailExists = await executeQueryFirst<User>(
      db,
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [updates.email.toLowerCase(), userId]
    );

    if (emailExists) {
      throw new Error('Email already in use');
    }
  }

  // Build update query
  const setClauses: string[] = [];
  const params: unknown[] = [];

  if (updates.name) {
    setClauses.push('name = ?');
    params.push(updates.name);
  }

  if (updates.email) {
    setClauses.push('email = ?');
    params.push(updates.email.toLowerCase());
  }

  setClauses.push('updated_at = ?');
  params.push(getCurrentTimestamp());

  params.push(userId);

  await executeMutation(
    db,
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );

  // Retrieve updated user
  const user = await executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    throw new Error('Failed to update user');
  }

  return toPublicUser(user);
}

/**
 * Change user password
 * 
 * @param db - D1 Database instance
 * @param userId - User ID
 * @param currentPassword - Current plain text password
 * @param newPassword - New plain text password
 * @throws Error if current password is incorrect
 */
export async function changePassword(
  db: D1Database,
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Get user with password hash
  const user = await executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.password_hash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await executeMutation(
    db,
    'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
    [newPasswordHash, getCurrentTimestamp(), userId]
  );
}

/**
 * Update user role (admin only)
 * 
 * @param db - D1 Database instance
 * @param userId - User ID to update
 * @param newRole - New role to assign
 * @returns Promise resolving to updated public user data
 * @throws Error if user not found
 */
export async function updateUserRole(
  db: D1Database,
  userId: string,
  newRole: UserRole
): Promise<UserPublic> {
  // Check if user exists
  const existingUser = await executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (!existingUser) {
    throw new Error('User not found');
  }

  // Update role
  await executeMutation(
    db,
    'UPDATE users SET role = ?, updated_at = ? WHERE id = ?',
    [newRole, getCurrentTimestamp(), userId]
  );

  // Retrieve updated user
  const user = await executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    throw new Error('Failed to update user role');
  }

  return toPublicUser(user);
}

/**
 * Deactivate user account (admin only)
 * 
 * @param db - D1 Database instance
 * @param userId - User ID to deactivate
 * @returns Promise resolving to updated public user data
 * @throws Error if user not found
 */
export async function deactivateUser(
  db: D1Database,
  userId: string
): Promise<UserPublic> {
  await executeMutation(
    db,
    'UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?',
    [fromBool(false), getCurrentTimestamp(), userId]
  );

  const user = await executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    throw new Error('User not found');
  }

  return toPublicUser(user);
}

/**
 * Activate user account (admin only)
 * 
 * @param db - D1 Database instance
 * @param userId - User ID to activate
 * @returns Promise resolving to updated public user data
 * @throws Error if user not found
 */
export async function activateUser(
  db: D1Database,
  userId: string
): Promise<UserPublic> {
  await executeMutation(
    db,
    'UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?',
    [fromBool(true), getCurrentTimestamp(), userId]
  );

  const user = await executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    throw new Error('User not found');
  }

  return toPublicUser(user);
}

/**
 * Delete user account (admin only)
 * Cascades to all user-related data
 * 
 * @param db - D1 Database instance
 * @param userId - User ID to delete
 * @throws Error if user not found
 */
export async function deleteUser(
  db: D1Database,
  userId: string
): Promise<void> {
  const result = await executeMutation(
    db,
    'DELETE FROM users WHERE id = ?',
    [userId]
  );

  if (result.meta && result.meta.changes === 0) {
    throw new Error('User not found');
  }
}

/**
 * Get user statistics
 * 
 * @param db - D1 Database instance
 * @param userId - User ID
 * @returns Promise resolving to user statistics
 */
export async function getUserStats(
  db: D1Database,
  userId: string
): Promise<{
  total_quizzes_created?: number;
  total_attempts?: number;
  average_score?: number;
  quizzes_completed?: number;
}> {
  const user = await executeQueryFirst<User>(
    db,
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    throw new Error('User not found');
  }

  const stats: {
    total_quizzes_created?: number;
    total_attempts?: number;
    average_score?: number;
    quizzes_completed?: number;
  } = {};

  if (user.role === 'instructor') {
    // Get quiz creation stats
    const quizStats = await executeQueryFirst<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM quizzes WHERE instructor_id = ?',
      [userId]
    );
    stats.total_quizzes_created = quizStats?.count || 0;
  }

  if (user.role === 'student') {
    // Get attempt stats
    const attemptStats = await executeQueryFirst<{
      total_attempts: number;
      average_score: number | null;
      quizzes_completed: number;
    }>(
      db,
      `SELECT 
         COUNT(*) as total_attempts,
         AVG(score) as average_score,
         COUNT(CASE WHEN is_completed = 1 THEN 1 END) as quizzes_completed
       FROM quiz_attempts 
       WHERE student_id = ?`,
      [userId]
    );

    stats.total_attempts = attemptStats?.total_attempts || 0;
    stats.average_score = attemptStats?.average_score || 0;
    stats.quizzes_completed = attemptStats?.quizzes_completed || 0;
  }

  return stats;
}

export default {
  registerUser,
  loginUser,
  getUserById,
  getUserByEmail,
  listUsers,
  updateUser,
  changePassword,
  updateUserRole,
  deactivateUser,
  activateUser,
  deleteUser,
  getUserStats,
};

