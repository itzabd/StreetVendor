const supabase = require('../config/supabase');

async function getAll(req, res) {
  const { block_id } = req.query;
  let query = supabase.from('spots').select('*, blocks(block_name, zones(name))').order('created_at', { ascending: false });
  if (block_id) query = query.eq('block_id', block_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function create(req, res) {
  const { block_id, spot_number, description, latitude, longitude } = req.body;
  if (!block_id || !spot_number) return res.status(400).json({ error: 'block_id and spot_number are required' });
  const { data, error } = await supabase
    .from('spots')
    .insert({ block_id, spot_number, description, latitude, longitude, status: 'available' })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

async function update(req, res) {
  const { spot_number, description, status, latitude, longitude } = req.body;
  const { data, error } = await supabase
    .from('spots')
    .update({ spot_number, description, status, latitude, longitude })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function remove(req, res) {
  const { error } = await supabase.from('spots').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Spot deleted' });
}

module.exports = { getAll, create, update, remove };
