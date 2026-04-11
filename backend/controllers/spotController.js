const supabase = require('../config/supabase');

async function getAll(req, res) {
  const { zone_id } = req.query;
  // Previously: let query = supabase.from('spots').select('*, blocks(block_name, zones(name))').order('created_at', { ascending: false });
  let query = supabase.from('spots').select('*, zones(name)').order('created_at', { ascending: false });
  if (zone_id) query = query.eq('zone_id', zone_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function create(req, res) {
  const { zone_id, spot_number, description, latitude, longitude } = req.body;
  if (!zone_id || !spot_number) return res.status(400).json({ error: 'zone_id and spot_number are required' });
  const { data, error } = await supabase
    .from('spots')
    .insert({ zone_id, spot_number, description, latitude, longitude, status: 'available' })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

async function update(req, res) {
  const { spot_number, description, status, latitude, longitude, zone_id } = req.body;
  const { data, error } = await supabase
    .from('spots')
    .update({ spot_number, description, status, latitude, longitude, zone_id })
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
