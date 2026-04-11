const supabase = require('../config/supabase');

async function getAll(req, res) {
  const isAdmin = req.profile && req.profile.role === 'admin';
  let query = supabase
    .from('vendor_applications')
    .select(`
      *,
      profiles!vendor_id(
        full_name,
        phone,
        avatar_url,
        nid_number,
        tin_number,
        home_address,
        business_name,
        operating_hours
      ),
      zones(name)
    `)
    .order('created_at', { ascending: false });

  // Vendors see only their own; admins see all
  if (!isAdmin) query = query.eq('vendor_id', req.user.id);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function create(req, res) {
  const { zone_id, notes, requested_from, requested_until } = req.body;

  let existingQuery = supabase
    .from('vendor_applications')
    .select('id, status')
    .eq('vendor_id', req.user.id)
    .in('status', ['pending', 'approved']);
    
  if (zone_id) existingQuery = existingQuery.eq('zone_id', zone_id);
  else existingQuery = existingQuery.is('zone_id', null);

  const { data: existing } = await existingQuery.single();

  if (existing) return res.status(400).json({ error: `You already have a ${existing.status} application for this location` });

  const { data, error } = await supabase
    .from('vendor_applications')
    .insert({ 
      vendor_id: req.user.id, 
      zone_id: zone_id || null, 
      notes, 
      status: 'pending',
      requested_from: requested_from || null,
      requested_until: requested_until || null
    })
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
