-- ============================================================
-- StreetVendor BD – Supabase Database Schema
-- Run this entire file in the Supabase SQL Editor
-- Project: https://app.supabase.com → SQL Editor → New Query
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  nid_number TEXT,
  role TEXT NOT NULL DEFAULT 'vendor' CHECK (role IN ('vendor', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Zones
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  area TEXT,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Blocks (belong to zones)
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  block_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Spots (belong to blocks)
CREATE TABLE IF NOT EXISTS spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  spot_number TEXT NOT NULL,
  description TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Vendor Applications
CREATE TABLE IF NOT EXISTS vendor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Spot Assignments
CREATE TABLE IF NOT EXISTS spot_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  rent_amount NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL,
  valid_from DATE,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  notes TEXT,
  issued_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Complaints
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
  admin_response TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Rent Records
CREATE TABLE IF NOT EXISTS rent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES spot_assignments(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'overdue')),
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_records ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access on profiles" ON profiles USING (true) WITH CHECK (true);

-- Zones: anyone authenticated can view; backend (service key) manages writes
CREATE POLICY "Authenticated users can view zones" ON zones FOR SELECT USING (auth.role() = 'authenticated');

-- Blocks: anyone authenticated can view
CREATE POLICY "Authenticated users can view blocks" ON blocks FOR SELECT USING (auth.role() = 'authenticated');

-- Spots: anyone authenticated can view
CREATE POLICY "Authenticated users can view spots" ON spots FOR SELECT USING (auth.role() = 'authenticated');

-- Applications: vendors see own; admins see all (handled in backend)
CREATE POLICY "Vendors can view own applications" ON vendor_applications FOR SELECT USING (auth.uid() = vendor_id);

-- Assignments: vendors see own
CREATE POLICY "Vendors can view own assignments" ON spot_assignments FOR SELECT USING (auth.uid() = vendor_id);

-- Permissions: vendors see own
CREATE POLICY "Vendors can view own permissions" ON permissions FOR SELECT USING (auth.uid() = vendor_id);

-- Complaints: vendors see own
CREATE POLICY "Vendors can view own complaints" ON complaints FOR SELECT USING (auth.uid() = vendor_id);

-- Rent Records: authenticated users (scoped in backend)
CREATE POLICY "Authenticated users can view rent records" ON rent_records FOR SELECT USING (auth.role() = 'authenticated');
