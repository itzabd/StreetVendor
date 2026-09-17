-- Add admin_notes to vendor_applications for rejection reasons and internal notes
ALTER TABLE vendor_applications 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;
