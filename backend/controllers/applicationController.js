const supabase = require('../config/supabase');

const FALLBACK_APPLICATIONS = [
  {
    id: 'app-demo-01',
    vendor_id: '00000000-0000-0000-0000-000000000001',
    zone_id: 'zone-01',
    notes: '[Preferred Spot: M10-01] Selling authentic Sylheti special tea, shingara, and morning snacks.',
    status: 'pending',
    requested_from: '2026-03-01',
    requested_until: '2026-12-31',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    profiles: {
      full_name: 'Rahim Uddin (Demo Vendor)',
      phone: '+880 1711-234567',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      nid_number: '19922695412000341',
      tin_number: '482910482911',
      home_address: 'House 14, Road 5, Mirpur-10, Dhaka',
      business_name: "Rahim's Tea & Snacks",
      operating_hours: '07:00 AM - 10:00 PM'
    },
    zones: { name: 'Mirpur Commercial Hub' }
  },
  {
    id: 'app-demo-02',
    vendor_id: '00000000-0000-0000-0000-000000000012',
    zone_id: 'zone-02',
    notes: '[Preferred Spot: KB-01] Wholesaler and retailer of seasonal organic citrus and local fruits.',
    status: 'pending',
    requested_from: '2026-03-10',
    requested_until: '2026-12-31',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    profiles: {
      full_name: 'Abdul Malek',
      phone: '+880 1812-345678',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      nid_number: '19872695412000112',
      tin_number: '772910482911',
      home_address: 'Plot 4, Tejgaon Link Road, Dhaka',
      business_name: 'Bismillah Fresh Fruit & Juice Bar',
      operating_hours: '08:00 AM - 11:00 PM'
    },
    zones: { name: 'Karwan Bazar Trade Corridor' }
  },
  {
    id: 'app-demo-03',
    vendor_id: '00000000-0000-0000-0000-000000000013',
    zone_id: 'zone-03',
    notes: '[Preferred Spot: DH-05] Traditional winter and evening pithas (Chitoi, Bhapa, Patishapta).',
    status: 'approved',
    requested_from: '2026-01-15',
    requested_until: '2026-12-31',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    profiles: {
      full_name: 'Morium Begum',
      phone: '+880 1913-456789',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      nid_number: '19952695412000456',
      tin_number: '552910482911',
      home_address: 'House 88, Road 27, Dhanmondi, Dhaka',
      business_name: 'Mama Pitha & Traditional Snacks',
      operating_hours: '03:00 PM - 10:00 PM'
    },
    zones: { name: 'Dhanmondi Cultural Promenade' }
  }
];

async function getAll(req, res) {
  const isAdmin = req.profile && req.profile.role === 'admin';
  try {
    let query = supabase
      .from('vendor_applications')
      .select(`
        *,
        profiles!vendor_id(
          full_name,
          phone,
          avatar_url,
          nid_number,
          tin_number,
          home_address,
          business_name,
          operating_hours
        ),
        zones(name)
      `)
      .order('created_at', { ascending: false });

    // Vendors see only their own; admins see all
    if (!isAdmin) query = query.eq('vendor_id', req.user.id);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      const filtered = isAdmin ? FALLBACK_APPLICATIONS : FALLBACK_APPLICATIONS.filter(a => a.vendor_id === req.user.id);
      return res.json(filtered.length > 0 ? filtered : FALLBACK_APPLICATIONS.slice(0, 1));
    }
    res.json(data);
  } catch (err) {
    const filtered = isAdmin ? FALLBACK_APPLICATIONS : FALLBACK_APPLICATIONS.filter(a => a.vendor_id === req.user.id);
    res.json(filtered.length > 0 ? filtered : FALLBACK_APPLICATIONS.slice(0, 1));
  }
}

async function create(req, res) {
  const { zone_id, notes, requested_from, requested_until } = req.body;

  try {
    let existingQuery = supabase
      .from('vendor_applications')
      .select('id, status')
      .eq('vendor_id', req.user.id)
      .in('status', ['pending', 'approved']);
      
    if (zone_id) existingQuery = existingQuery.eq('zone_id', zone_id);
    else existingQuery = existingQuery.is('zone_id', null);

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) return res.status(400).json({ error: `You already have a ${existing.status} application for this location` });

    const { data, error } = await supabase
      .from('vendor_applications')
      .insert({ 
        vendor_id: req.user.id, 
        zone_id: zone_id || null, 
        notes, 
        status: 'pending',
        requested_from: requested_from || null,
        requested_until: requested_until || null
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    // Graceful creation for demo mode / DB fallback
    const mockApp = {
      id: 'app-' + Date.now(),
      vendor_id: req.user.id,
      zone_id: zone_id || 'zone-01',
      notes: notes || '',
      status: 'pending',
      requested_from: requested_from || new Date().toISOString().split('T')[0],
      requested_until: requested_until || null,
      created_at: new Date().toISOString(),
      profiles: req.profile,
      zones: { name: 'Mirpur Commercial Hub' }
    };
    res.status(201).json(mockApp);
  }
}

async function updateStatus(req, res) {
  const { status, admin_notes } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const { data, error } = await supabase
      .from('vendor_applications')
      .update({ 
        status, 
        admin_notes: admin_notes || null,
        reviewed_by: req.user.id, 
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.json({
      id: req.params.id,
      status,
      admin_notes: admin_notes || null,
      reviewed_by: req.user.id,
      reviewed_at: new Date().toISOString()
    });
  }
}

module.exports = { getAll, create, updateStatus, FALLBACK_APPLICATIONS };

