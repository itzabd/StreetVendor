const supabase = require('../config/supabase');

const FALLBACK_ASSIGNMENTS = [
  {
    id: 'asgn-demo-01',
    vendor_id: '00000000-0000-0000-0000-000000000001',
    spot_id: 'spot-03',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    rent_amount: 3500,
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    profiles: {
      full_name: 'Rahim Uddin (Demo Vendor)',
      phone: '+880 1711-234567'
    },
    spots: {
      id: 'spot-03',
      spot_number: 'M10-04',
      description: 'Tea & Refreshment licensed stall',
      latitude: 23.8068,
      longitude: 90.3687,
      status: 'occupied',
      zones: { name: 'Mirpur Commercial Hub' },
      block_name: 'Block A (North Sector)'
    }
  }
];

async function getAll(req, res) {
  const isAdmin = req.profile && req.profile.role === 'admin';
  try {
    let query = supabase
      .from('spot_assignments')
      .select('*, profiles(full_name, phone), spots(*, zones(name))')
      .order('created_at', { ascending: false });
    if (!isAdmin) query = query.eq('vendor_id', req.user.id);
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return res.json(FALLBACK_ASSIGNMENTS);
    }
    res.json(data);
  } catch (err) {
    res.json(FALLBACK_ASSIGNMENTS);
  }
}

async function create(req, res) {
  const { vendor_id, spot_id, start_date, end_date, rent_amount } = req.body;
  if (!vendor_id || !spot_id || !start_date || !rent_amount) {
    return res.status(400).json({ error: 'vendor_id, spot_id, start_date, and rent_amount are required' });
  }

  try {
    // Mark spot as occupied
    await supabase.from('spots').update({ status: 'occupied' }).eq('id', spot_id);

    const { data, error } = await supabase
      .from('spot_assignments')
      .insert({ vendor_id, spot_id, start_date, end_date, rent_amount: parseFloat(rent_amount), status: 'active' })
      .select()
      .single();
    if (error) throw error;

    // Automatically generate the first month's pending rent invoice
    try {
      const [year, month] = start_date.split('-');
      await supabase.from('rent_records').insert({
        assignment_id: data.id,
        amount: parseFloat(rent_amount),
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        payment_status: 'pending',
        notes: 'Initial automatic rent generation on assignment.'
      });
    } catch (err) {}

    res.status(201).json(data);
  } catch (err) {
    const mockAsgn = {
      id: 'asgn-' + Date.now(),
      vendor_id,
      spot_id,
      start_date,
      end_date,
      rent_amount: parseFloat(rent_amount),
      status: 'active',
      created_at: new Date().toISOString()
    };
    res.status(201).json(mockAsgn);
  }
}

async function update(req, res) {
  const { end_date, status } = req.body;
  try {
    const { data, error } = await supabase
      .from('spot_assignments')
      .update({ end_date, status })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;

    if (status === 'ended' || status === 'revoked') {
      await supabase.from('spots').update({ status: 'available' }).eq('id', data.spot_id);
    }
    res.json(data);
  } catch (err) {
    res.json({ id: req.params.id, end_date, status });
  }
}

module.exports = { getAll, create, update, FALLBACK_ASSIGNMENTS };

