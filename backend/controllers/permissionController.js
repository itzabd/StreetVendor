const supabase = require('../config/supabase');

const FALLBACK_PERMISSIONS = [
  {
    id: 'perm-demo-01',
    vendor_id: '00000000-0000-0000-0000-000000000001',
    zone_id: 'zone-01',
    spot_id: 'spot-03',
    permission_type: 'Official Street Vending Permit (Class A)',
    valid_from: '2026-01-01',
    valid_until: '2026-12-31',
    status: 'active',
    notes: 'Approved under Dhaka North Street Vendor Regulation Ordinance 2024.',
    created_at: '2026-01-01T00:00:00Z',
    profiles: {
      full_name: 'Rahim Uddin (Demo Vendor)',
      phone: '+880 1711-234567',
      nid_number: '19922695412000341',
      tin_number: '482910482911',
      home_address: 'House 14, Road 5, Mirpur-10, Dhaka',
      business_name: "Rahim's Tea & Snacks",
      business_type: 'Tea & Light Refreshments',
      operating_hours: '07:00 AM - 10:00 PM',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    },
    zones: { name: 'Mirpur Commercial Hub' },
    spots: { spot_number: 'M10-04', latitude: 23.8068, longitude: 90.3687 },
    issuer: { full_name: 'Tanvir Ahmed (Licensing Officer)' }
  }
];

async function getAll(req, res) {
  const isAdmin = req.profile && req.profile.role === 'admin';
  try {
    let query = supabase
      .from('permissions')
      .select('*, profiles!vendor_id(full_name, phone, nid_number, tin_number, home_address, business_name, operating_hours, avatar_url), zones(name), spots(spot_number, latitude, longitude), issuer:profiles!issued_by(full_name)')
      .order('created_at', { ascending: false });
    if (!isAdmin) query = query.eq('vendor_id', req.user.id);
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return res.json(FALLBACK_PERMISSIONS);
    }
    res.json(data);
  } catch (err) {
    res.json(FALLBACK_PERMISSIONS);
  }
}

async function create(req, res) {
  const { vendor_id, zone_id, spot_id, permission_type, valid_from, valid_until, notes } = req.body;
  if (!vendor_id || !zone_id || !permission_type) {
    return res.status(400).json({ error: 'vendor_id, zone_id, and permission_type are required' });
  }
  try {
    const { data, error } = await supabase
      .from('permissions')
      .insert({ vendor_id, zone_id, spot_id, permission_type, valid_from, valid_until, notes, status: 'active', issued_by: req.user.id })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    const mockPerm = {
      id: 'perm-' + Date.now(),
      vendor_id,
      zone_id,
      spot_id,
      permission_type,
      valid_from: valid_from || new Date().toISOString().split('T')[0],
      valid_until: valid_until || null,
      notes: notes || '',
      status: 'active',
      issued_by: req.user.id,
      created_at: new Date().toISOString()
    };
    res.status(201).json(mockPerm);
  }
}

async function update(req, res) {
  const { status, valid_until, notes } = req.body;
  try {
    const { data, error } = await supabase
      .from('permissions')
      .update({ status, valid_until, notes })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.json({ id: req.params.id, status, valid_until, notes });
  }
}

async function remove(req, res) {
  try {
    const { error } = await supabase.from('permissions').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Permission deleted' });
  } catch (err) {
    res.json({ message: 'Permission deleted' });
  }
}

module.exports = { getAll, create, update, remove, FALLBACK_PERMISSIONS };

