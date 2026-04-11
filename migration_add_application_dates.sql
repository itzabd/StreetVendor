-- Run this in your Supabase SQL Editor to add the missing columns.
-- This is safe to run even if columns already exist (IF NOT EXISTS).

ALTER TABLE vendor_applications
  ADD COLUMN IF NOT EXISTS requested_from DATE,
  ADD COLUMN IF NOT EXISTS requested_until DATE;
