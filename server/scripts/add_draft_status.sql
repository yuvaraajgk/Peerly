-- ============================================
-- Add 'Draft' Status to Items Table
-- ============================================
-- Run this SQL in your Supabase SQL Editor if you have an existing database
-- This adds 'Draft' as a valid status for items (used when editing)
-- ============================================

-- Drop the old constraint
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_status_check;

-- Add new constraint with 'Draft' status
ALTER TABLE items ADD CONSTRAINT items_status_check 
  CHECK (status IN ('Available', 'Sold', 'Rented', 'Draft'));

-- ============================================
-- Migration Complete!
-- ============================================
