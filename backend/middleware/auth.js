const supabase = require('../config/supabase');

// Verify Supabase JWT and attach user + profile to req
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  // Get user from Supabase using the access token
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Fetch profile for role info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  req.user = user;
  req.profile = profile;
  next();
}

// Only allow admins
function requireAdmin(req, res, next) {
  if (!req.profile || req.profile.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
