const supabase = require('../config/supabase');

// Curated Showcase Vendors across Dhaka for resilient public demo
const FALLBACK_PUBLIC_VENDORS = [
  {
    id: 'demo-asgn-01',
    vendor_id: '00000000-0000-0000-0000-000000000001',
    status: 'active',
    rent_amount: 3500,
    profiles: {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Rahim Uddin',
      business_name: "Rahim's Tea & Fuchka Corner",
      operating_hours: '07:00 AM - 10:30 PM',
      phone: '+880 1711-234567',
      status: 'active',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    },
    spots: {
      id: 'demo-spot-01',
      spot_number: 'M10-04',
      latitude: 23.8068,
      longitude: 90.3687,
      status: 'occupied',
      zones: { name: 'Mirpur Commercial Zone', area: 'Dhaka North' }
    },
    ratings: { good: 34, reasonable: 5, worst: 1 }
  },
  {
    id: 'demo-asgn-02',
    vendor_id: '00000000-0000-0000-0000-000000000012',
    status: 'active',
    rent_amount: 4200,
    profiles: {
      id: '00000000-0000-0000-0000-000000000012',
      full_name: 'Abdul Malek',
      business_name: 'Bismillah Fresh Fruit & Juice Bar',
      operating_hours: '08:00 AM - 11:00 PM',
      phone: '+880 1812-345678',
      status: 'active',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    spots: {
      id: 'demo-spot-02',
      spot_number: 'KB-08',
      latitude: 23.7516,
      longitude: 90.3938,
      status: 'occupied',
      zones: { name: 'Karwan Bazar Trade Hub', area: 'Dhaka Central' }
    },
    ratings: { good: 48, reasonable: 6, worst: 2 }
  },
  {
    id: 'demo-asgn-03',
    vendor_id: '00000000-0000-0000-0000-000000000013',
    status: 'active',
    rent_amount: 3800,
    profiles: {
      id: '00000000-0000-0000-0000-000000000013',
      full_name: 'Morium Begum',
      business_name: 'Mama Pitha & Traditional Snacks',
      operating_hours: '03:00 PM - 10:00 PM',
      phone: '+880 1913-456789',
      status: 'active',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
    },
    spots: {
      id: 'demo-spot-03',
      spot_number: 'DH-27',
      latitude: 23.7533,
      longitude: 90.3769,
      status: 'occupied',
      zones: { name: 'Dhanmondi Cultural Square', area: 'Dhaka South' }
    },
    ratings: { good: 62, reasonable: 4, worst: 0 }
  },
  {
    id: 'demo-asgn-04',
    vendor_id: '00000000-0000-0000-0000-000000000014',
    status: 'active',
    rent_amount: 4500,
    profiles: {
      id: '00000000-0000-0000-0000-000000000014',
      full_name: 'Mohammad Shahid',
      business_name: 'Old Dhaka Shahi Halim & Cha',
      operating_hours: '06:00 AM - 11:30 PM',
      phone: '+880 1614-567890',
      status: 'active',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
    },
    spots: {
      id: 'demo-spot-04',
      spot_number: 'LB-02',
      latitude: 23.7196,
      longitude: 90.3881,
      status: 'occupied',
      zones: { name: 'Lalbagh Heritage Zone', area: 'Old Dhaka' }
    },
    ratings: { good: 75, reasonable: 8, worst: 3 }
  },
  {
    id: 'demo-asgn-05',
    vendor_id: '00000000-0000-0000-0000-000000000015',
    status: 'active',
    rent_amount: 5000,
    profiles: {
      id: '00000000-0000-0000-0000-000000000015',
      full_name: 'Zahangir Hossain',
      business_name: 'Gulshan Green Coconut & Organic Drinks',
      operating_hours: '08:30 AM - 08:00 PM',
      phone: '+880 1715-678901',
      status: 'active',
      avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'
    },
    spots: {
      id: 'demo-spot-05',
      spot_number: 'GL-15',
      latitude: 23.7925,
      longitude: 90.4167,
      status: 'occupied',
      zones: { name: 'Gulshan-2 Diplomatic Zone', area: 'Dhaka North' }
    },
    ratings: { good: 41, reasonable: 5, worst: 1 }
  }
];

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
          profiles:vendor_id (id, full_name, business_name, operating_hours, phone, status),
          spots:spot_id (
            id, 
            spot_number, 
            latitude, 
            longitude,
            zones:zone_id (name, area)
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

      // 3. Fetch aggregate ratings for these vendors and reports
      const { data: ratings, error: rateError } = await supabase
        .from('vendor_ratings')
        .select('vendor_id, guest_report_id, rating_type');

      if (rateError) throw rateError;

      // 4. Map ratings to vendors (handles both official and reports)
      const ratingMap = (ratings || []).reduce((acc, r) => {
        const id = r.vendor_id || r.guest_report_id;
        if (!id) return acc;
        if (!acc[id]) acc[id] = { good: 0, worst: 0, reasonable: 0 };
        acc[id][r.rating_type]++;
        return acc;
      }, {});

      // 5. Combine data
      const official = (assignments || []).map(a => ({
        ...a,
        ratings: ratingMap[a.vendor_id] || { good: 0, worst: 0, reasonable: 0 }
      }));

      const reported = (approvedReports || []).map(r => ({
        id: r.id,
        is_guest_report: true,
        profiles: { full_name: r.vendor_name, status: 'unverified' },
        category: r.category,
        spots: {
          latitude: r.latitude,
          longitude: r.longitude,
          status: 'unverified'
        },
        ratings: ratingMap[r.id] || { good: 0, worst: 0, reasonable: 0 }
      }));

      const combined = [...official, ...reported];
      // If DB returned nothing (empty or fresh setup), serve the rich showcase dataset
      if (combined.length === 0) {
        return res.json(FALLBACK_PUBLIC_VENDORS);
      }

      res.json(combined);
    } catch (err) {
      console.warn('Database query failed in getAllVendors, serving fallback showcase data:', err.message || err);
      // Graceful showcase fallback prevents 500 error on frontend
      res.json(FALLBACK_PUBLIC_VENDORS);
    }
  },


  // Submit a rating (Now allows guests)
  // Submit a rating (Now allows guests)
  submitRating: async (req, res) => {
    try {
      const { vendor_id, rating_type, comment } = req.body;
      const rater_id = req.user ? req.user.id : null; 
      
      // 1. Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', vendor_id)
        .maybeSingle();

      const isOfficial = !!profile;
      
      const insertObj = {
        rater_id,
        rating_type,
        comment,
        vendor_id: isOfficial ? vendor_id : null,
        guest_report_id: isOfficial ? null : vendor_id
      };

      const { data, error } = await supabase
        .from('vendor_ratings')
        .insert([insertObj])
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
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
      // Return empty array for demo — no DB table yet
      console.warn('getReports DB unavailable, returning empty showcase array:', err.message);
      res.json([]);
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
  },

  // Public license verification
  verifyLicense: async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('permissions')
        .select('*, profiles!vendor_id(full_name, business_name, avatar_url), zones(name), spots(spot_number), issuer:profiles!issued_by(full_name)')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'License not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = publicController;
