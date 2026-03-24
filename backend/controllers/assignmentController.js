const supabase = require('../config/supabase');

async function getAll(req, res) {
  const isAdmin = req.profile && req.profile.role === 'admin';
  let query = supabase
    .from('spot_assignments')
    .select('*, profiles(full_name, phone), spots(spot_number, blocks(block_name, zones(name)))')
    .order('created_at', { ascending: false });
  if (!isAdmin) query = query.eq('vendor_id', req.user.id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function create(req, res) {
  const { vendor_id, spot_id, start_date, end_date, rent_amount } = req.body;
  if (!vendor_id || !spot_id || !start_date || !rent_amount) {
    return res.status(400).json({ error: 'vendor_id, spot_id, start_date, and rent_amount are required' });
  }
  // Mark spot as occupied
  await supabase.from('spots').update({ status: 'occupied' }).eq('id', spot_id);

  const { data, error } = await supabase
    .from('spot_assignments')
    .insert({ vendor_id, spot_id, start_date, end_date, rent_amount: parseFloat(rent_amount), status: 'active' })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });

  // Automatically generate the first month's pending rent invoice
  try {
    const [year, month] = start_date.split('-');
    const { error: rentError } = await supabase.from('rent_records').insert({
      assignment_id: data.id,
      amount: parseFloat(rent_amount),
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      payment_status: 'pending',
      notes: 'Initial automatic rent generation on assignment.'
    });
    if (rentError) console.error('Failed to create initial rent record:', rentError);
  } catch (err) {
    console.error('Error generating rent record:', err);
  }

  res.status(201).json(data);
}

async function update(req, res) {
  const { end_date, status } = req.body;
  const { data, error } = await supabase
    .from('spot_assignments')
    .update({ end_date, status })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });

  // If ended/revoked, free the spot
  if (status === 'ended' || status === 'revoked') {
    await supabase.from('spots').update({ status: 'available' }).eq('id', data.spot_id);
  }
  res.json(data);
}

module.exports = { getAll, create, update };
