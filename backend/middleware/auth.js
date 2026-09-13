const supabase = require('../config/supabase');

const DEMO_PROFILES = {
  'demo-vendor-token': {
    user: { id: '00000000-0000-0000-0000-000000000001', email: 'demo.vendor@streetvendor.bd' },
    profile: {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Rahim Uddin (Demo Vendor)',
      phone: '+880 1711-234567',
      nid_number: '19922695412000341',
      role: 'vendor',
      status: 'active',
      home_address: 'House 14, Road 5, Mirpur-10, Dhaka',
      onboarding_completed: true,
      tin_number: '482910482911',
      business_name: "Rahim's Tea & Snacks",
      business_type: 'Tea & Light Refreshments',
      operating_hours: '07:00 AM - 10:00 PM',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    }
  },
  'demo-admin-token': {
    user: { id: '00000000-0000-0000-0000-000000000002', email: 'demo.admin@streetvendor.bd' },
    profile: {
      id: '00000000-0000-0000-0000-000000000002',
      full_name: 'Tanvir Ahmed (Demo Licensing Officer)',
      phone: '+880 1819-876543',
      nid_number: '19852695412000889',
      role: 'admin',
      status: 'active',
      home_address: 'City Corporation Zone Office, Dhaka North',
      onboarding_completed: true,
      tin_number: '992019482911',
      business_name: 'Dhaka North City Corporation (DNCC)',
      business_type: 'Urban Governance & Licensing',
      operating_hours: '09:00 AM - 05:00 PM',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
    }
  }
};

// Verify Supabase JWT or Demo Token and attach user + profile to req
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  // Handle Demo tokens instantly for public showcase
  if (DEMO_PROFILES[token]) {
    req.user = DEMO_PROFILES[token].user;
    req.profile = DEMO_PROFILES[token].profile;
    req.isDemo = true;
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    req.user = user;
    req.profile = profile;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Optional auth — doesn't block if no token
async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  if (DEMO_PROFILES[token]) {
    req.user = DEMO_PROFILES[token].user;
    req.profile = DEMO_PROFILES[token].profile;
    req.isDemo = true;
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      req.user = user;
      req.profile = profile;
    }
  } catch (err) {
    // Silently fail for optional auth
  }
  next();
}

// Only allow admins
function requireAdmin(req, res, next) {
  if (!req.profile || req.profile.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticate, optionalAuthenticate, requireAdmin, DEMO_PROFILES };

