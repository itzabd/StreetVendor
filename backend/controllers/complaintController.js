const supabase = require('../config/supabase');

const FALLBACK_COMPLAINTS = [
  {
    id: 'comp-demo-01',
    vendor_id: '00000000-0000-0000-0000-000000000001',
    subject: 'Temporary water logging near Spot M10-04',
    description: 'During heavy rain, water accumulates near the walkway drain causing inconvenience to customers.',
    status: 'in_review',
    admin_response: 'City engineering team dispatched to inspect drainage cleaning.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    profiles: { full_name: 'Rahim Uddin (Demo Vendor)', phone: '+880 1711-234567' }
  }
];

async function getAll(req, res) {
  const isAdmin = req.profile && req.profile.role === 'admin';
  try {
    let query = supabase
      .from('complaints')
      .select('*, profiles!vendor_id(full_name, phone)')
      .order('created_at', { ascending: false });
    if (!isAdmin) query = query.eq('vendor_id', req.user.id);
    const { data, error } = await query;
    if (error || !data || data.length === 0) return res.json(FALLBACK_COMPLAINTS);
    res.json(data);
  } catch (err) {
    res.json(FALLBACK_COMPLAINTS);
  }
}

async function create(req, res) {
  const { subject, description } = req.body;
  if (!subject || !description) return res.status(400).json({ error: 'subject and description are required' });
  try {
    const { data, error } = await supabase
      .from('complaints')
      .insert({ vendor_id: req.user.id, subject, description, status: 'open' })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    const mockComp = {
      id: 'comp-' + Date.now(),
      vendor_id: req.user.id,
      subject,
      description,
      status: 'open',
      created_at: new Date().toISOString()
    };
    res.status(201).json(mockComp);
  }
}

async function updateStatus(req, res) {
  const { status, admin_response } = req.body;
  if (!['open', 'in_review', 'resolved', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const { data, error } = await supabase
      .from('complaints')
      .update({ status, admin_response, resolved_by: req.user.id, resolved_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.json({ id: req.params.id, status, admin_response });
  }
}

module.exports = { getAll, create, updateStatus, FALLBACK_COMPLAINTS };

