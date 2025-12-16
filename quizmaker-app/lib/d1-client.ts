/**
 * D1 Database Client
 * 
 * This module provides a centralized interface for interacting with Cloudflare D1 database.
 * It includes helpers for parameter normalization, query execution, and ID generation.
 * 
 * Key Features:
 * - Automatic parameter placeholder normalization (? → ?1, ?2, ...)
 * - Type-safe query execution
 * - Transaction support
 * - UUID generation for primary keys
 */

import { D1Database, D1Result } from '@cloudflare/workers-types';

/**
 * Normalize anonymous placeholders to positional ones
 * Converts "SELECT * FROM users WHERE id = ? AND role = ?" 
 * to "SELECT * FROM users WHERE id = ?1 AND role = ?2"
 * 
 * This is required for D1 local development compatibility
 */
function normalizePlaceholders(sql: string): string {
  let index = 0;
  return sql.replace(/\?(?!\d)/g, () => {
    index++;
    return `?${index}`;
  });
}

/**
 * Execute a SELECT query and return all results
 * 
 * @param db - D1 Database instance
 * @param sql - SQL query string (can use ? placeholders)
 * @param params - Array of parameter values
 * @returns Promise resolving to array of result rows
 */
export async function executeQuery<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const normalizedSql = normalizePlaceholders(sql);
  const stmt = db.prepare(normalizedSql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  const result = await bound.all<T>();
  
  if (!result.success) {
    throw new Error(`Query failed: ${result.error}`);
  }
  
  return result.results || [];
}

/**
 * Execute a SELECT query and return the first result
 * 
 * @param db - D1 Database instance
 * @param sql - SQL query string (can use ? placeholders)
 * @param params - Array of parameter values
 * @returns Promise resolving to first row or null
 */
export async function executeQueryFirst<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const results = await executeQuery<T>(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute an INSERT, UPDATE, or DELETE query
 * 
 * @param db - D1 Database instance
 * @param sql - SQL mutation query
 * @param params - Array of parameter values
 * @returns Promise resolving to D1Result with success status
 */
export async function executeMutation(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result> {
  const normalizedSql = normalizePlaceholders(sql);
  const stmt = db.prepare(normalizedSql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  const result = await bound.run();
  
  if (!result.success) {
    throw new Error(`Mutation failed: ${result.error}`);
  }
  
  return result;
}

/**
 * Execute multiple statements in a batch (transaction)
 * All statements succeed or all fail together
 * 
 * @param db - D1 Database instance
 * @param statements - Array of { sql, params } objects
 * @returns Promise resolving to array of D1Results
 */
export async function executeBatch(
  db: D1Database,
  statements: Array<{ sql: string; params?: unknown[] }>
): Promise<D1Result[]> {
  const preparedStatements = statements.map(({ sql, params = [] }) => {
    const normalizedSql = normalizePlaceholders(sql);
    const stmt = db.prepare(normalizedSql);
    return params.length > 0 ? stmt.bind(...params) : stmt;
  });
  
  const results = await db.batch(preparedStatements);
  
  // Check if any statement failed
  const failedResult = results.find(r => !r.success);
  if (failedResult) {
    throw new Error(`Batch execution failed: ${failedResult.error}`);
  }
  
  return results;
}

/**
 * Generate a UUID v4 for use as primary key
 * Uses crypto.randomUUID() for secure random generation
 * 
 * @returns UUID string in format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get current timestamp in milliseconds
 * Compatible with D1 INTEGER timestamp storage
 * 
 * @returns Current Unix timestamp in milliseconds
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Convert D1 boolean integer (0/1) to JavaScript boolean
 * 
 * @param value - Integer value from database (0 or 1)
 * @returns Boolean true for 1, false for 0
 */
export function toBool(value: number | null | undefined): boolean {
  return value === 1;
}

/**
 * Convert JavaScript boolean to D1 integer (0/1)
 * 
 * @param value - Boolean value
 * @returns Integer 1 for true, 0 for false
 */
export function fromBool(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Get D1 database instance from Cloudflare environment
 * This helper ensures type safety when accessing the database binding
 * 
 * @param env - Cloudflare environment bindings
 * @returns D1Database instance
 * @throws Error if database binding not found
 */
export function getDatabase(env: { quizmaker_app_database?: D1Database }): D1Database {
  if (!env.quizmaker_app_database) {
    throw new Error('Database binding "quizmaker_app_database" not found');
  }
  return env.quizmaker_app_database;
}

/**
 * Type guard to check if a value is a valid D1 database instance
 */
export function isD1Database(value: unknown): value is D1Database {
  return (
    value !== null &&
    typeof value === 'object' &&
    'prepare' in value &&
    'batch' in value &&
    'exec' in value
  );
}

/**
 * Paginated query helper
 * 
 * @param db - D1 Database instance
 * @param sql - Base SQL query (without LIMIT/OFFSET)
 * @param params - Query parameters
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of results per page
 * @returns Promise resolving to paginated results with metadata
 */
export async function executeQueryPaginated<T = unknown>(
  db: D1Database,
  sql: string,
  params: unknown[] = [],
  page: number = 1,
  pageSize: number = 10
): Promise<{
  results: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalResults: number;
}> {
  // Get total count
  const countSql = `SELECT COUNT(*) as count FROM (${sql})`;
  const countResult = await executeQueryFirst<{ count: number }>(db, countSql, params);
  const totalResults = countResult?.count || 0;
  const totalPages = Math.ceil(totalResults / pageSize);
  
  // Get paginated results
  const offset = (page - 1) * pageSize;
  const paginatedSql = `${sql} LIMIT ${pageSize} OFFSET ${offset}`;
  const results = await executeQuery<T>(db, paginatedSql, params);
  
  return {
    results,
    page,
    pageSize,
    totalPages,
    totalResults,
  };
}

/**
 * Transaction helper using D1 batch
 * Executes multiple statements atomically
 * 
 * @param db - D1 Database instance
 * @param callback - Function that returns array of statements
 * @returns Promise resolving to transaction result
 */
export async function transaction<T>(
  db: D1Database,
  callback: () => Array<{ sql: string; params?: unknown[] }>
): Promise<T[]> {
  const statements = callback();
  const results = await executeBatch(db, statements);
  return results as unknown as T[];
}

export default {
  executeQuery,
  executeQueryFirst,
  executeMutation,
  executeBatch,
  generateId,
  getCurrentTimestamp,
  toBool,
  fromBool,
  getDatabase,
  isD1Database,
  executeQueryPaginated,
  transaction,
};

