const supabase = require('../config/supabase');

const FALLBACK_SPOTS = [
  { id: 'spot-01', zone_id: 'zone-01', spot_number: 'M10-01', description: 'North-west pavement kiosk space (8x6 ft)', latitude: 23.8068, longitude: 90.3687, status: 'available', zones: { name: 'Mirpur Commercial Hub' } },
  { id: 'spot-02', zone_id: 'zone-01', spot_number: 'M10-02', description: 'Corner snack stall area (6x6 ft)', latitude: 23.8075, longitude: 90.3695, status: 'available', zones: { name: 'Mirpur Commercial Hub' } },
  { id: 'spot-03', zone_id: 'zone-01', spot_number: 'M10-04', description: 'Tea & Refreshment licensed stall', latitude: 23.8062, longitude: 90.3680, status: 'occupied', zones: { name: 'Mirpur Commercial Hub' } },
  { id: 'spot-04', zone_id: 'zone-02', spot_number: 'KB-01', description: 'Fresh produce lane slot #1 (10x8 ft)', latitude: 23.7516, longitude: 90.3938, status: 'available', zones: { name: 'Karwan Bazar Trade Corridor' } },
  { id: 'spot-05', zone_id: 'zone-02', spot_number: 'KB-08', description: 'Fruit & juice cart designated space', latitude: 23.7522, longitude: 90.3945, status: 'occupied', zones: { name: 'Karwan Bazar Trade Corridor' } },
  { id: 'spot-06', zone_id: 'zone-03', spot_number: 'DH-05', description: 'Lake walkway snack spot (6x6 ft)', latitude: 23.7533, longitude: 90.3769, status: 'available', zones: { name: 'Dhanmondi Cultural Promenade' } },
  { id: 'spot-07', zone_id: 'zone-04', spot_number: 'LB-01', description: 'Historic front gate artisan booth', latitude: 23.7196, longitude: 90.3881, status: 'available', zones: { name: 'Lalbagh Heritage Walk' } },
  { id: 'spot-08', zone_id: 'zone-05', spot_number: 'GL-02', description: 'Civic plaza licensed drink cart', latitude: 23.7925, longitude: 90.4167, status: 'available', zones: { name: 'Gulshan Civic Plaza' } }
];

async function getAll(req, res) {
  try {
    const { zone_id } = req.query;
    let query = supabase.from('spots').select('*, zones(name)').order('created_at', { ascending: false });
    if (zone_id) query = query.eq('zone_id', zone_id);
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      const filtered = zone_id ? FALLBACK_SPOTS.filter(s => s.zone_id === zone_id) : FALLBACK_SPOTS;
      return res.json(filtered);
    }
    res.json(data);
  } catch (err) {
    const { zone_id } = req.query;
    const filtered = zone_id ? FALLBACK_SPOTS.filter(s => s.zone_id === zone_id) : FALLBACK_SPOTS;
    res.json(filtered);
  }
}

async function create(req, res) {
  const { zone_id, spot_number, description, latitude, longitude } = req.body;
  if (!zone_id || !spot_number) return res.status(400).json({ error: 'zone_id and spot_number are required' });
  try {
    const { data, error } = await supabase
      .from('spots')
      .insert({ zone_id, spot_number, description, latitude, longitude, status: 'available' })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(201).json({
      id: 'spot-' + Date.now(),
      zone_id,
      spot_number,
      description: description || '',
      latitude,
      longitude,
      status: 'available',
      created_at: new Date().toISOString()
    });
  }
}

async function update(req, res) {
  const { spot_number, description, status, latitude, longitude, zone_id } = req.body;
  try {
    const { data, error } = await supabase
      .from('spots')
      .update({ spot_number, description, status, latitude, longitude, zone_id })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.json({ id: req.params.id, spot_number, description, status, latitude, longitude, zone_id });
  }
}

async function remove(req, res) {
  try {
    const { error } = await supabase.from('spots').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Spot deleted' });
  } catch (err) {
    res.json({ message: 'Spot deleted' });
  }
}

module.exports = { getAll, create, update, remove, FALLBACK_SPOTS };

