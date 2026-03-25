const supabase = require('../config/supabase');

const publicController = {
  // Get all vendors with their active spot and ratings
  getAllVendors: async (req, res) => {
    try {
      // 1. Fetch active assignments with vendor and spot details
      const { data: assignments, error: asgnError } = await supabase
        .from('spot_assignments')
        .select(`
          id,
          vendor_id,
          status,
          rent_amount,
          profiles:vendor_id (id, full_name, phone, status),
          spots:spot_id (
            id, 
            spot_number, 
            latitude, 
            longitude,
            blocks:block_id (
              block_name,
              zones:zone_id (name, area)
            )
          )
        `)
        .eq('status', 'active');

      if (asgnError) throw asgnError;

      // 2. Fetch approved guest reports
      const { data: approvedReports, error: reportError } = await supabase
        .from('guest_reports')
        .select('*')
        .eq('status', 'approved');

      if (reportError) throw reportError;

      // 3. Fetch aggregate ratings for these vendors
      const vendorIds = assignments.map(a => a.vendor_id);
      const { data: ratings, error: rateError } = await supabase
        .from('vendor_ratings')
        .select('vendor_id, rating_type');

      if (rateError) throw rateError;

      // 4. Map ratings to vendors
      const ratingMap = ratings.reduce((acc, r) => {
        if (!acc[r.vendor_id]) acc[r.vendor_id] = { good: 0, worst: 0, reasonable: 0 };
        acc[r.vendor_id][r.rating_type]++;
        return acc;
      }, {});

      // 5. Combine data
      const official = assignments.map(a => ({
        ...a,
        ratings: ratingMap[a.vendor_id] || { good: 0, worst: 0, reasonable: 0 }
      }));

      const reported = approvedReports.map(r => ({
        id: r.id,
        is_guest_report: true,
        profiles: { full_name: r.vendor_name, status: 'unverified' },
        category: r.category,
        spots: {
          latitude: r.latitude,
          longitude: r.longitude,
          status: 'unverified'
        },
        ratings: { good: 0, worst: 0, reasonable: 0 }
      }));

      res.json([...official, ...reported]);
    } catch (err) {
      console.error('Error fetching public vendors:', err);
      res.status(500).json({ error: 'Failed to fetch vendor data' });
    }
  },

  // Submit a rating (Now allows guests)
  submitRating: async (req, res) => {
    try {
      const { vendor_id, rating_type, comment } = req.body;
      const rater_id = req.user ? req.user.id : null; // Optional rater_id
      
      const { data, error } = await supabase
        .from('vendor_ratings')
        .insert([{
          vendor_id,
          rater_id,
          rating_type,
          comment
        }])
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Submit a report for a new spot (Public/Guest)
  submitReport: async (req, res) => {
    try {
      const { latitude, longitude, comment, vendor_name, category, reported_by_name } = req.body;
      const { data, error } = await supabase
        .from('guest_reports')
        .insert([{ 
          latitude, 
          longitude, 
          comment, 
          vendor_name, 
          category, 
          reported_by_name 
        }])
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Admin: Get all guest reports
  getReports: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('guest_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Admin: Approve/Reject report
  updateReportStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'approved' or 'rejected'

      const { data, error } = await supabase
        .from('guest_reports')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Toggle favorite
  toggleFavorite: async (req, res) => {
    try {
      const { vendor_id } = req.body;
      const user_id = req.user.id;

      // Check if exists
      const { data: existing } = await supabase
        .from('vendor_favorites')
        .select('id')
        .eq('user_id', user_id)
        .eq('vendor_id', vendor_id)
        .maybeSingle();

      if (existing) {
        await supabase.from('vendor_favorites').delete().eq('id', existing.id);
        res.json({ favorite: false });
      } else {
        await supabase.from('vendor_favorites').insert([{ user_id, vendor_id }]);
        res.json({ favorite: true });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Get user favorites
  getFavorites: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('vendor_favorites')
        .select('vendor_id')
        .eq('user_id', req.user.id);
      
      if (error) throw error;
      res.json(data.map(f => f.vendor_id));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = publicController;
