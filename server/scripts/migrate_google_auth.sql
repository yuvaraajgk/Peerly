-- ============================================
-- Google OAuth Migration for Peerly
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================

-- Add new columns to users table for Google OAuth
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMP;

-- Make password_hash nullable (since Google OAuth users don't need passwords)
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Create index on google_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Add constraint to ensure username format (3-20 alphanumeric + underscore)
-- Use DO block to conditionally add constraint only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'username_format_check' 
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT username_format_check 
        CHECK (username IS NULL OR (LENGTH(username) >= 3 AND LENGTH(username) <= 20 AND username ~ '^[a-zA-Z0-9_]+$'));
    END IF;
END $$;

-- ============================================
-- Migration Complete!
-- ============================================
-- Users can now sign up with Google OAuth
-- Verification codes are stored temporarily
-- Usernames are unique and optional
-- ============================================
