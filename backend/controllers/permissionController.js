const supabase = require('../config/supabase');

async function getAll(req, res) {
  const isAdmin = req.profile && req.profile.role === 'admin';
  let query = supabase
    .from('permissions')
    .select('*, profiles!vendor_id(full_name), zones(name)')
    .order('created_at', { ascending: false });
  if (!isAdmin) query = query.eq('vendor_id', req.user.id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function create(req, res) {
  const { vendor_id, zone_id, permission_type, valid_from, valid_until, notes } = req.body;
  if (!vendor_id || !zone_id || !permission_type) {
    return res.status(400).json({ error: 'vendor_id, zone_id, and permission_type are required' });
  }
  const { data, error } = await supabase
    .from('permissions')
    .insert({ vendor_id, zone_id, permission_type, valid_from, valid_until, notes, status: 'active', issued_by: req.user.id })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

async function update(req, res) {
  const { status, valid_until, notes } = req.body;
  const { data, error } = await supabase
    .from('permissions')
    .update({ status, valid_until, notes })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function remove(req, res) {
  const { error } = await supabase.from('permissions').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Permission deleted' });
}

module.exports = { getAll, create, update, remove };
