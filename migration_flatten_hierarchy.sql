-- ============================================================
-- StreetVendor BD — Full Migration Script
-- Run this entire file in the Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ── STEP 1: Add zone_id directly to spots (flatten hierarchy) ──
ALTER TABLE spots ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES zones(id) ON DELETE CASCADE;

-- ── STEP 2: Backfill zone_id from existing block→zone relationship ──
-- (Safe to run even if blocks table is empty)
UPDATE spots s
SET zone_id = b.zone_id
FROM blocks b
WHERE s.block_id = b.id
  AND s.zone_id IS NULL;

-- ── STEP 3: Make zone_id NOT NULL (after backfill) ──
-- Only run this after verifying STEP 2 backfilled all rows.
-- If any spots have no zone, this will fail — fix those first.
ALTER TABLE spots ALTER COLUMN zone_id SET NOT NULL;

-- ── STEP 4: Drop the old block_id FK from spots ──
ALTER TABLE spots DROP COLUMN IF EXISTS block_id;

-- ── STEP 5: Add date fields to vendor_applications ──
ALTER TABLE vendor_applications
  ADD COLUMN IF NOT EXISTS requested_from DATE,
  ADD COLUMN IF NOT EXISTS requested_until DATE;

-- ── STEP 6: Relax zone_id NOT NULL on vendor_applications ──
-- (Vendors may apply without a specific zone in some flows)
ALTER TABLE vendor_applications ALTER COLUMN zone_id DROP NOT NULL;

-- ── STEP 7 (Optional): Drop the blocks table ──
-- Only run after confirming spots.block_id is gone and no other tables reference blocks.
-- DROP TABLE IF EXISTS blocks CASCADE;

-- ── STEP 8: Update RLS for spots (no longer references blocks) ──
-- Existing policy "Authenticated users can view spots" should still work.
-- No changes needed here.

-- ── VERIFICATION ──
-- Run these to confirm everything is correct:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'spots';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'vendor_applications';
