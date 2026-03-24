const supabase = require('../config/supabase');

async function getAll(req, res) {
  const isAdmin = req.profile && req.profile.role === 'admin';
  let query = supabase
    .from('complaints')
    .select('*, profiles!vendor_id(full_name, phone)')
    .order('created_at', { ascending: false });
  if (!isAdmin) query = query.eq('vendor_id', req.user.id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function create(req, res) {
  const { subject, description } = req.body;
  if (!subject || !description) return res.status(400).json({ error: 'subject and description are required' });
  const { data, error } = await supabase
    .from('complaints')
    .insert({ vendor_id: req.user.id, subject, description, status: 'open' })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

async function updateStatus(req, res) {
  const { status, admin_response } = req.body;
  if (!['open', 'in_review', 'resolved', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const { data, error } = await supabase
    .from('complaints')
    .update({ status, admin_response, resolved_by: req.user.id, resolved_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

module.exports = { getAll, create, updateStatus };
