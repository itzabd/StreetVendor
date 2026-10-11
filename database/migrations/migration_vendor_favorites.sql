-- ============================================================
-- Migration: Add vendor_favorites table for saving/bookmarking vendors
-- Supports authenticated users bookmarking vendors or citizen reports
-- ============================================================

CREATE TABLE IF NOT EXISTS vendor_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_favorites_user ON vendor_favorites(user_id);

ALTER TABLE vendor_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites" ON vendor_favorites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on vendor_favorites" ON vendor_favorites
  USING (true) WITH CHECK (true);
