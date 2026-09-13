const supabase = require('../config/supabase');

const FALLBACK_ADMIN_VENDORS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    full_name: 'Rahim Uddin (Demo Vendor)',
    phone: '+880 1711-234567',
    nid_number: '19922695412000341',
    role: 'vendor',
    status: 'active',
    home_address: 'House 14, Road 5, Mirpur-10, Dhaka',
    onboarding_completed: true,
    tin_number: '482910482911',
    business_name: "Rahim's Tea & Snacks",
    business_type: 'Tea & Light Refreshments',
    operating_hours: '07:00 AM - 10:00 PM',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: '00000000-0000-0000-0000-000000000012',
    full_name: 'Abdul Malek',
    phone: '+880 1812-345678',
    nid_number: '19872695412000112',
    role: 'vendor',
    status: 'active',
    home_address: 'Plot 4, Tejgaon Link Road, Dhaka',
    onboarding_completed: true,
    tin_number: '772910482911',
    business_name: 'Bismillah Fresh Fruit & Juice Bar',
    business_type: 'Seasonal Fruits',
    operating_hours: '08:00 AM - 11:00 PM',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    created_at: '2026-01-10T00:00:00Z'
  },
  {
    id: '00000000-0000-0000-0000-000000000013',
    full_name: 'Morium Begum',
    phone: '+880 1913-456789',
    nid_number: '19952695412000456',
    role: 'vendor',
    status: 'active',
    home_address: 'House 88, Road 27, Dhanmondi, Dhaka',
    onboarding_completed: true,
    tin_number: '552910482911',
    business_name: 'Mama Pitha & Traditional Snacks',
    business_type: 'Traditional Food',
    operating_hours: '03:00 PM - 10:00 PM',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    created_at: '2026-01-15T00:00:00Z'
  }
];

async function getProfile(req, res) {
  if (req.profile) return res.json(req.profile);
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();
    if (error || !data) return res.json(req.profile || FALLBACK_ADMIN_VENDORS[0]);
    res.json(data);
  } catch (err) {
    res.json(req.profile || FALLBACK_ADMIN_VENDORS[0]);
  }
}

async function updateProfile(req, res) {
  const { 
    full_name, phone, nid_number, home_address, 
    tin_number, business_name, business_type, 
    operating_hours, avatar_url, onboarding_completed 
  } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        full_name, phone, nid_number, home_address, 
        tin_number, business_name, business_type, 
        operating_hours, avatar_url, onboarding_completed 
      })
      .eq('id', req.user.id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    const updated = {
      ...(req.profile || {}),
      id: req.user.id,
      full_name: full_name || req.profile?.full_name,
      phone: phone || req.profile?.phone,
      nid_number: nid_number || req.profile?.nid_number,
      home_address: home_address || req.profile?.home_address,
      tin_number: tin_number || req.profile?.tin_number,
      business_name: business_name || req.profile?.business_name,
      business_type: business_type || req.profile?.business_type,
      operating_hours: operating_hours || req.profile?.operating_hours,
      avatar_url: avatar_url || req.profile?.avatar_url,
      onboarding_completed: onboarding_completed !== undefined ? onboarding_completed : true
    };
    res.json(updated);
  }
}

// Admin only: Get all vendors
async function getAllVendors(req, res) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'vendor')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return res.json(FALLBACK_ADMIN_VENDORS);
    res.json(data);
  } catch (err) {
    res.json(FALLBACK_ADMIN_VENDORS);
  }
}

// Admin only: Update vendor profile
async function adminUpdateVendor(req, res) {
  const { id } = req.params;
  const { 
    full_name, phone, nid_number, home_address, 
    tin_number, business_name, business_type, 
    operating_hours, avatar_url, onboarding_completed,
    role, status
  } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        full_name, phone, nid_number, home_address, 
        tin_number, business_name, business_type, 
        operating_hours, avatar_url, onboarding_completed,
        role, status
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.json({ id, full_name, phone, role, status, business_name });
  }
}

module.exports = { getProfile, updateProfile, getAllVendors, adminUpdateVendor, FALLBACK_ADMIN_VENDORS };

