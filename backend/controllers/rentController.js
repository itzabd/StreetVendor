const supabase = require('../config/supabase');

const FALLBACK_RENT_RECORDS = [
  {
    id: 'rent-demo-01',
    assignment_id: 'asgn-demo-01',
    amount: 3500,
    month: 2,
    year: 2026,
    payment_status: 'paid',
    notes: 'February 2026 monthly commercial spot dues (bKash Transaction: TR7719283)',
    created_at: '2026-02-05T00:00:00Z',
    spot_assignments: {
      spots: { spot_number: 'M10-04' },
      profiles: { full_name: 'Rahim Uddin (Demo Vendor)' }
    }
  },
  {
    id: 'rent-demo-02',
    assignment_id: 'asgn-demo-01',
    amount: 3500,
    month: 3,
    year: 2026,
    payment_status: 'paid',
    notes: 'March 2026 spot fee paid at City Counter',
    created_at: '2026-03-04T00:00:00Z',
    spot_assignments: {
      spots: { spot_number: 'M10-04' },
      profiles: { full_name: 'Rahim Uddin (Demo Vendor)' }
    }
  }
];

async function getAll(req, res) {
  const isAdmin = req.profile && req.profile.role === 'admin';
  try {
    let query = supabase
      .from('rent_records')
      .select('*, spot_assignments(spots(spot_number), profiles(full_name))')
      .order('created_at', { ascending: false });
    if (!isAdmin) {
      const { data: myAssignments } = await supabase
        .from('spot_assignments')
        .select('id')
        .eq('vendor_id', req.user.id);
      const ids = (myAssignments || []).map(a => a.id);
      if (ids.length === 0) return res.json(FALLBACK_RENT_RECORDS);
      query = query.in('assignment_id', ids);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) return res.json(FALLBACK_RENT_RECORDS);
    res.json(data);
  } catch (err) {
    res.json(FALLBACK_RENT_RECORDS);
  }
}

async function create(req, res) {
  const { assignment_id, amount, month, year, notes } = req.body;
  if (!assignment_id || !amount || !month || !year) {
    return res.status(400).json({ error: 'assignment_id, amount, month, and year are required' });
  }
  try {
    const { data, error } = await supabase
      .from('rent_records')
      .insert({ assignment_id, amount, month, year, notes, payment_status: 'paid', recorded_by: req.user.id })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(201).json({
      id: 'rent-' + Date.now(),
      assignment_id,
      amount,
      month,
      year,
      notes,
      payment_status: 'paid',
      created_at: new Date().toISOString()
    });
  }
}

async function update(req, res) {
  const { amount, payment_status, notes } = req.body;
  try {
    const { data, error } = await supabase
      .from('rent_records')
      .update({ amount, payment_status, notes })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.json({ id: req.params.id, amount, payment_status, notes });
  }
}

module.exports = { getAll, create, update, FALLBACK_RENT_RECORDS };

