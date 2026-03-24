const supabase = require('../config/supabase');

async function getAll(req, res) {
  const isAdmin = req.profile && req.profile.role === 'admin';
  let query = supabase
    .from('rent_records')
    .select('*, spot_assignments(spots(spot_number), profiles(full_name))')
    .order('created_at', { ascending: false });
  if (!isAdmin) {
    // Vendors see rent for their own assignments
    const { data: myAssignments } = await supabase
      .from('spot_assignments')
      .select('id')
      .eq('vendor_id', req.user.id);
    const ids = (myAssignments || []).map(a => a.id);
    if (ids.length === 0) return res.json([]);
    query = query.in('assignment_id', ids);
  }
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function create(req, res) {
  const { assignment_id, amount, month, year, notes } = req.body;
  if (!assignment_id || !amount || !month || !year) {
    return res.status(400).json({ error: 'assignment_id, amount, month, and year are required' });
  }
  const { data, error } = await supabase
    .from('rent_records')
    .insert({ assignment_id, amount, month, year, notes, payment_status: 'paid', recorded_by: req.user.id })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

async function update(req, res) {
  const { amount, payment_status, notes } = req.body;
  const { data, error } = await supabase
    .from('rent_records')
    .update({ amount, payment_status, notes })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

module.exports = { getAll, create, update };
