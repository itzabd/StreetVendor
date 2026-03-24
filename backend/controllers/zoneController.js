const supabase = require('../config/supabase');

async function getAll(req, res) {
  const { data, error } = await supabase.from('zones').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function create(req, res) {
  const { name, area, description, boundary_geojson } = req.body;
  if (!name) return res.status(400).json({ error: 'Zone name is required' });
  const { data, error } = await supabase
    .from('zones')
    .insert({ 
      name, 
      area, 
      description, 
      created_by: req.user.id, 
      boundary_geojson: boundary_geojson && boundary_geojson.length > 0 ? boundary_geojson : null 
    })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
}

async function update(req, res) {
  const { name, area, description } = req.body;
  const { data, error } = await supabase
    .from('zones')
    .update({ name, area, description })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function remove(req, res) {
  const { error } = await supabase.from('zones').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Zone deleted' });
}

module.exports = { getAll, create, update, remove };
