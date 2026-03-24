const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, full_name, phone, nid_number } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'email, password, and full_name are required' });
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) return res.status(400).json({ error: authError.message });

  // Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    full_name,
    phone: phone || null,
    nid_number: nid_number || null,
    role: 'vendor',
    status: 'active',
  });

  if (profileError) return res.status(400).json({ error: profileError.message });

  res.status(201).json({ message: 'Vendor registered successfully' });
});

module.exports = router;
