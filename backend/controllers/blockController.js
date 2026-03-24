const supabase = require('../config/supabase');

async function getAll(req, res) {
  const { zone_id } = req.query;
  let query = supabase.from('blocks').select('*, zones(name)').order('created_at', { ascending: false });
  if (zone_id) query = query.eq('zone_id', zone_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function create(req, res) {
  const { zone_id, block_name } = req.body;
  if (!zone_id || !block_name) return res.status(400).json({ error: 'zone_id and block_name are required' });
  const { data, error } = await supabase
    .from('blocks')
    .insert({ zone_id, block_name })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

async function update(req, res) {
  const { block_name } = req.body;
  const { data, error } = await supabase
    .from('blocks')
    .update({ block_name })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function remove(req, res) {
  const { error } = await supabase.from('blocks').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Block deleted' });
}

module.exports = { getAll, create, update, remove };
