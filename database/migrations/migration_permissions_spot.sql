-- ── STEP 1: Add spot_id to permissions table ──
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS spot_id UUID REFERENCES spots(id);

-- ── STEP 2: Backfill spot_id from spot_assignments ──
-- This links existing licenses to the spot assignment valid at that time
UPDATE permissions p
SET spot_id = sa.spot_id
FROM spot_assignments sa
WHERE p.vendor_id = sa.vendor_id
  AND (sa.start_date <= p.valid_from OR sa.start_date IS NULL)
  AND p.spot_id IS NULL;
