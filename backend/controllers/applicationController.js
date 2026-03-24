const supabase = require('../config/supabase');

async function getAll(req, res) {
  const isAdmin = req.profile && req.profile.role === 'admin';
  let query = supabase
    .from('vendor_applications')
    .select('*, profiles!vendor_id(full_name, phone), zones(name)')
    .order('created_at', { ascending: false });

  // Vendors see only their own; admins see all
  if (!isAdmin) query = query.eq('vendor_id', req.user.id);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function create(req, res) {
  const { zone_id, notes } = req.body;
  if (!zone_id) return res.status(400).json({ error: 'zone_id is required' });

  // Check for existing pending/approved application to same zone
  const { data: existing } = await supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('vendor_id', req.user.id)
    .eq('zone_id', zone_id)
    .in('status', ['pending', 'approved'])
    .single();

  if (existing) return res.status(400).json({ error: `You already have a ${existing.status} application for this zone` });

  const { data, error } = await supabase
    .from('vendor_applications')
    .insert({ vendor_id: req.user.id, zone_id, notes, status: 'pending' })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

async function updateStatus(req, res) {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const { data, error } = await supabase
    .from('vendor_applications')
    .update({ status, reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

module.exports = { getAll, create, updateStatus };
