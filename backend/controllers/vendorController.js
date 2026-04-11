const supabase = require('../config/supabase');

async function getProfile(req, res) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

async function updateProfile(req, res) {
  const { 
    full_name, phone, nid_number, home_address, 
    tin_number, business_name, business_type, 
    operating_hours, avatar_url, onboarding_completed 
  } = req.body;
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      full_name, phone, nid_number, home_address, 
      tin_number, business_name, business_type, 
      operating_hours, avatar_url, onboarding_completed 
    })
    .eq('id', req.user.id)
    .select()
    .single();
    
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

module.exports = { getProfile, updateProfile };
