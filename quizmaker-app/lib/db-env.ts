/**
 * Database Environment Helper
 * 
 * This module provides a way to access the D1 database in different environments.
 * For local development without Cloudflare Workers, it provides helpful error messages.
 */

import { D1Database } from '@cloudflare/workers-types';

/**
 * Get the database from the environment
 * Handles both Cloudflare Workers environment and development environment
 */
export function getDatabaseFromEnv(): D1Database {
  // Check if we're in a Cloudflare Workers environment
  if (typeof process !== 'undefined' && process.env) {
    const env = process.env as unknown as { quizmaker_app_database?: D1Database };
    
    if (env.quizmaker_app_database) {
      return env.quizmaker_app_database;
    }
  }

  // If database binding is not available, throw a helpful error
  throw new Error(
    'Database binding not available. ' +
    'For local development, please run: npm run preview (uses wrangler) ' +
    'or set up a local D1 database connection.'
  );
}

/**
 * Check if database is available
 */
export function isDatabaseAvailable(): boolean {
  try {
    if (typeof process !== 'undefined' && process.env) {
      const env = process.env as unknown as { quizmaker_app_database?: D1Database };
      return !!env.quizmaker_app_database;
    }
    return false;
  } catch {
    return false;
  }
}

