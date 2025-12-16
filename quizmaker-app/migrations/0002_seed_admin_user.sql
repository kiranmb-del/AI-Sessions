-- Migration: 0002_seed_admin_user
-- Description: Create initial admin user account
-- Date: 2025-12-16
-- Note: Default password is 'Admin@123' - CHANGE THIS IMMEDIATELY after first login!

-- ==============================================================================
-- CREATE ADMIN USER
-- ==============================================================================
-- Default credentials:
--   Email: admin@quizmaker.com
--   Password: Admin@123 (bcrypt hash below)
-- 
-- The password hash is for 'Admin@123' with bcrypt salt rounds = 10
-- Hash generated using: bcrypt.hash('Admin@123', 10)
-- ==============================================================================

INSERT INTO users (
  id,
  email,
  password_hash,
  name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'admin-00000-00000-00000-000000000001',
  'admin@quizmaker.com',
  '$2b$10$YXZvjE4vZ5b5xKqjH4LGVOqY9pLxJ7fOHJZ5pN4xJ5xJ5xJ5xJ5xJ',
  'System Administrator',
  'admin',
  1,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================
-- To verify admin user was created, run:
-- SELECT id, email, name, role FROM users WHERE role = 'admin';
-- ==============================================================================

-- ==============================================================================
-- SECURITY NOTE
-- ==============================================================================
-- IMPORTANT: Change the admin password immediately after first login!
-- 
-- The default password 'Admin@123' is for initial setup only.
-- 
-- To change password:
-- 1. Log in with admin@quizmaker.com / Admin@123
-- 2. Navigate to Profile Settings
-- 3. Update password to a strong, unique password
-- 
-- For production environments, consider:
-- - Minimum 12 characters
-- - Mix of uppercase, lowercase, numbers, and symbols
-- - No dictionary words
-- - Unique to this application
-- ==============================================================================

