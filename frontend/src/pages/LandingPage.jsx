import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/auth/AuthModal';
import ZoneMap from '../components/ZoneMap';
import VendorPublicCard from '../components/VendorPublicCard';
import axios from 'axios';

export default function LandingPage() {
  const { user, profile, enterDemoMode, isDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Discovery States
  const [authMode, setAuthMode] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mobileTab, setMobileTab] = useState('map'); // 'map' or 'list' for responsive UX
  const base = import.meta.env.VITE_API_URL;

  // Fallback curated vendors for resilient Dhaka municipal showcase
  const FALLBACK_VENDORS = [
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
      rent_amount: 3100,
      profiles: {
        id: '00000000-0000-0000-0000-000000000014',
        full_name: 'Faruk Hossain',
        business_name: 'Dhaka Streetwear & Accessories',
        operating_hours: '11:00 AM - 09:30 PM',
        phone: '+880 1614-567890',
        status: 'active',
      },
      spots: {
        id: 'demo-spot-04',
        spot_number: 'NM-15',
        latitude: 23.7335,
        longitude: 90.3842,
        status: 'occupied',
        zones: { name: 'New Market Footwear Corridor', area: 'Dhaka South' }
      },
      ratings: { good: 29, reasonable: 8, worst: 3 }
    },
    {
      id: 'demo-asgn-05',
      vendor_id: '00000000-0000-0000-0000-000000000015',
      status: 'active',
      rent_amount: 3600,
      profiles: {
        id: '00000000-0000-0000-0000-000000000015',
        full_name: 'Shah Alam',
        business_name: 'Alam Fast Food & Biryani Corner',
        operating_hours: '12:00 PM - 11:30 PM',
        phone: '+880 1715-678901',
        status: 'active',
      },
      spots: {
        id: 'demo-spot-05',
        spot_number: 'GL-03',
        latitude: 23.7925,
        longitude: 90.4078,
        status: 'occupied',
        zones: { name: 'Gulshan-1 Food Alley', area: 'Dhaka North' }
      },
      ratings: { good: 51, reasonable: 7, worst: 1 }
    },
    {
      id: 'demo-asgn-06',
      vendor_id: '00000000-0000-0000-0000-000000000016',
      status: 'active',
      rent_amount: 2800,
      profiles: {
        id: '00000000-0000-0000-0000-000000000016',
        full_name: 'Rokeya Khatun',
        business_name: 'Rokeya Handicrafts & Jute Bags',
        operating_hours: '10:00 AM - 08:00 PM',
        phone: '+880 1816-789012',
        status: 'active',
      },
      spots: {
        id: 'demo-spot-06',
        spot_number: 'OD-11',
        latitude: 23.7104,
        longitude: 90.4074,
        status: 'occupied',
        zones: { name: 'Sadarghat Riverfront Strip', area: 'Old Dhaka' }
      },
      ratings: { good: 38, reasonable: 3, worst: 0 }
    },
    {
      id: 'demo-asgn-07',
      vendor_id: '00000000-0000-0000-0000-000000000017',
      status: 'active',
      rent_amount: 3200,
      profiles: {
        id: '00000000-0000-0000-0000-000000000017',
        full_name: 'Nasir Uddin',
        business_name: 'Nasir Electronics & Mobile Repair',
        operating_hours: '10:00 AM - 10:00 PM',
        phone: '+880 1917-890123',
        status: 'active',
      },
      spots: {
        id: 'demo-spot-07',
        spot_number: 'UT-09',
        latitude: 23.8732,
        longitude: 90.3965,
        status: 'occupied',
        zones: { name: 'Uttara Sector 3 Station Gate', area: 'Dhaka North' }
      },
      ratings: { good: 42, reasonable: 5, worst: 2 }
    },
    {
      id: 'demo-asgn-08',
      vendor_id: '00000000-0000-0000-0000-000000000018',
      status: 'active',
      rent_amount: 3000,
      profiles: {
        id: '00000000-0000-0000-0000-000000000018',
        full_name: 'Belal Ahmed',
        business_name: 'Chawkbazar Spices & Dry Fruits',
        operating_hours: '08:30 AM - 09:00 PM',
        phone: '+880 1518-901234',
        status: 'active',
      },
      spots: {
        id: 'demo-spot-08',
        spot_number: 'CB-22',
        latitude: 23.7175,
        longitude: 90.3980,
        status: 'occupied',
        zones: { name: 'Chawkbazar Heritage Trade Lane', area: 'Old Dhaka' }
      },
      ratings: { good: 70, reasonable: 9, worst: 1 }
    },
  ];

  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]);
  const [mapZoom, setMapZoom] = useState(13);
  const [isReporting, setIsReporting] = useState(false);
  const [reportData, setReportData] = useState({
    vendor_name: '',
    category: '',
    reported_by_name: '',
    comment: ''
  });

  const [reportDraft, setReportDraft] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Sync mode query parameter (e.g. ?mode=login or ?mode=register)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    if (mode === 'login' || mode === 'register') {
      setAuthMode(mode);
    }
  }, [location.search]);

  useEffect(() => {
    fetchVendors();
    if (user) fetchFavorites();
    else loadGuestFavorites();
  }, [user]);

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${base}/public/vendors`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setVendors(res.data);
      } else {
        setVendors(FALLBACK_VENDORS);
      }
    } catch (err) {
      console.warn('Using fallback showcase vendors:', err.message || err);
      setVendors(FALLBACK_VENDORS);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = await (async () => {
        const { data: { session } } = await (await import('../supabaseClient')).default.auth.getSession();
        return session?.access_token;
      })();
      if (!token) return;
      const res = await axios.get(`${base}/public/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(res.data);
    } catch (err) {
      console.error('Failed to fetch favorites', err);
    }
  };

  const loadGuestFavorites = () => {
    const local = localStorage.getItem('sv_guest_favorites');
    if (local) setFavorites(JSON.parse(local));
  };

  const handleToggleFavorite = async (vendorId) => {
    if (!user) {
      const newFavs = favorites.includes(vendorId)
        ? favorites.filter(id => id !== vendorId)
        : [...favorites, vendorId];
      setFavorites(newFavs);
      localStorage.setItem('sv_guest_favorites', JSON.stringify(newFavs));
      return;
    }

    try {
      const token = await (async () => {
        const { data: { session } } = await (await import('../supabaseClient')).default.auth.getSession();
        return session?.access_token;
      })();
      const res = await axios.post(`${base}/public/favorite`, { vendor_id: vendorId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.favorite) setFavorites([...favorites, vendorId]);
      else setFavorites(favorites.filter(id => id !== vendorId));
    } catch (err) {
      console.error('Favorite toggle failed', err);
    }
  };

  const handleRate = async (vendorId, ratingType) => {
    // Optimistic UI update
    setVendors(prev => prev.map(v => {
      const id = v.vendor_id || v.id;
      if (id === vendorId) {
        const r = { ...(v.ratings || { good: 0, reasonable: 0, worst: 0 }) };
        r[ratingType] = (r[ratingType] || 0) + 1;
        return { ...v, ratings: r };
      }
      return v;
    }));

    try {
      await axios.post(`${base}/public/rate`, { vendor_id: vendorId, rating: ratingType });
    } catch (err) {
      console.error('Rating failed', err);
    }
  };

  const handleSelectVendor = (vendor) => {
    const lat = vendor.spots?.latitude ?? vendor.latitude;
    const lng = vendor.spots?.longitude ?? vendor.longitude;
    if (lat && lng) {
      setMapCenter([parseFloat(lat), parseFloat(lng)]);
      setMapZoom(17);
      if (window.innerWidth < 992) {
        setMobileTab('map');
      }
    }
  };

  const handlePointPick = (pt) => {
    setReportDraft(pt);
  };

  const handleSubmitReport = async () => {
    if (!reportDraft || !reportData.vendor_name) return;
    try {
      await axios.post(`${base}/public/report`, {
        latitude: reportDraft[0],
        longitude: reportDraft[1],
        ...reportData
      });
      setReportSuccess(true);
      setReportDraft(null);
      setReportData({ vendor_name: '', category: '', reported_by_name: '', comment: '' });
      setIsReporting(false);
      setTimeout(() => setReportSuccess(false), 5000);
      fetchVendors();
    } catch (err) {
      console.error('Report failed', err);
    }
  };

  const handleDashboardRedirect = () => {
    if (profile?.role === 'admin') navigate('/admin');
    else navigate('/vendor');
  };

  const filteredVendors = vendors.filter(v => {
    const nameStr = (v.profiles?.business_name || v.profiles?.full_name || v.vendor_name || '').toLowerCase();
    const zoneStr = (v.spots?.zones?.name || v.spots?.blocks?.zones?.name || v.category || '').toLowerCase();
    const spotStr = (v.spots?.spot_number || '').toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = nameStr.includes(q) || zoneStr.includes(q) || spotStr.includes(q);

    if (filter === 'all') return matchesSearch;
    const r = v.ratings || { good: 0, reasonable: 0, worst: 0 };
    const max = Math.max(r.good, r.reasonable, r.worst);
    if (max === 0) return matchesSearch;
    if (filter === 'good') return r.good === max && matchesSearch;
    if (filter === 'reasonable') return r.reasonable === max && matchesSearch;
    if (filter === 'worst') return r.worst === max && matchesSearch;
    return matchesSearch;
  });

  const spotMarkers = vendors.map(v => {
    const r = v.ratings || { good: 0, reasonable: 0, worst: 0 };
    const max = Math.max(r.good, r.reasonable, r.worst);
    
    let displayColor = null;
    if (max > 0) {
      if (r.good === max) displayColor = '#0D6942'; // Civic Green
      else if (r.reasonable === max) displayColor = '#C58A2B'; // Ochre
      else displayColor = '#C8372D'; // Vermilion
    }

    return {
      ...v.spots,
      latitude: v.spots?.latitude ?? v.latitude,
      longitude: v.spots?.longitude ?? v.longitude,
      spot_number: v.spots?.spot_number || (v.is_guest_report ? 'UNVERIFIED' : 'SPOT'),
      status: v.is_guest_report ? 'unverified' : (v.spots?.status || 'occupied'),
      vendor_name: v.profiles?.business_name || v.profiles?.full_name || v.vendor_name,
      operating_hours: v.profiles?.operating_hours,
      ratings: r,
      displayColor
    };
  });

  const jumpToWard = (lat, lng, zoomLevel = 15) => {
    setMapCenter([lat, lng]);
    setMapZoom(zoomLevel);
  };

  return (
    <div className="sv-broadside-page">
      {/* ─── Top Broadside Navigation ───────────────────────── */}
      <header className="sv-broadside-nav">
        <div className="sv-nav-seal">
          <div className="sv-seal-icon">⚖️</div>
          <div className="sv-nav-titles">
            <h1>StreetVendor BD</h1>
            <div className="sv-meta-tag">Dhaka Municipal Vending Registry & Spatial Ledger</div>
          </div>
        </div>

        <div className="sv-nav-actions">
          {user ? (
            <button onClick={handleDashboardRedirect} className="btn sv-btn-warning btn-sm px-3">
              {isDemo ? '⭐ Active Demo Session' : 'Go to Portal'}
            </button>
          ) : (
            <>
              {/* Dual Frictionless Demo Entries */}
              <button 
                onClick={() => { enterDemoMode('vendor'); navigate('/vendor'); }} 
                className="btn btn-sm sv-btn-primary px-3 font-monospace"
                title="Immediately test vendor spot M10-04, rent records & QR license PDF generator"
              >
                ⚡ Try Demo (Merchant)
              </button>

              <button 
                onClick={() => { enterDemoMode('admin'); navigate('/admin'); }} 
                className="btn btn-sm sv-btn-warning px-3 font-monospace"
                title="Immediately test licensing desk, zone boundaries & applications review"
              >
                🔑 Try Demo (Officer)
              </button>

              <button 
                onClick={() => setAuthMode('login')} 
                className="btn btn-sm btn-outline-light font-monospace"
                style={{ fontSize: '11.5px', borderRadius: 2 }}
              >
                Sign In
              </button>

              <button 
                onClick={() => setAuthMode('register')} 
                className="btn btn-sm font-monospace"
                style={{ background: '#FFF7E6', color: '#141716', border: '1px solid #C58A2B', fontSize: '11.5px', borderRadius: 2 }}
              >
                Register
              </button>
            </>
          )}
        </div>
      </header>

      {/* ─── Mobile View Toggler Tabs (<992px) ──────────────── */}
      <div className="sv-mobile-view-tabs">
        <button 
          className={`sv-mobile-tab-btn ${mobileTab === 'map' ? 'active' : ''}`}
          onClick={() => setMobileTab('map')}
        >
          🗺️ GIS Cartography Canvas
        </button>
        <button 
          className={`sv-mobile-tab-btn ${mobileTab === 'list' ? 'active' : ''}`}
          onClick={() => setMobileTab('list')}
        >
          📋 Spot Directory ({filteredVendors.length})
        </button>
      </div>

      {/* ─── Main Broadside Asymmetric Layout ────────────────── */}
      <main className={`sv-broadside-layout mobile-view-${mobileTab}`}>
        
        {/* LEFT COLUMN: Civic Ledger & Spot Directory */}
        <section className="sv-ledger-docket">
          {/* Official Gazette Decree Header */}
          <div className="sv-decree-banner">
            <div className="sv-docket-stamp">
              <span>🏛️</span> DNCC / DSCC MUNICIPAL TRADE SPATIAL LEDGER • DHAKA
            </div>
            <h2 className="sv-decree-title">
              Spatial Allocation & Digital Trade Licensing System
            </h2>
            <p className="sv-decree-subtitle">
              An authoritative civic registry formalizing informal urban commerce. Connecting designated GPS trade spots, verified biometric merchant permits, and community-audited service trust.
            </p>
          </div>

          {/* Frictionless Demo Command Matrix */}
          <div className="sv-guest-command-box">
            <div className="sv-guest-command-header">
              <div className="sv-guest-command-title">
                <span>⚡</span> Instant Public Showcase Session — No Sign-Up
              </div>
              <span className="font-monospace text-muted" style={{ fontSize: '10px' }}>
                [FULL INTERACTION READY]
              </span>
            </div>

            <div className="sv-guest-action-grid">
              <div 
                className="sv-guest-tile vendor"
                onClick={() => { enterDemoMode('vendor'); navigate('/vendor'); }}
              >
                <div>
                  <div className="sv-guest-tile-role">Merchant Actor</div>
                  <div className="sv-guest-tile-name">Rahim Uddin</div>
                  <div className="sv-guest-tile-desc">
                    Allocated spot <strong>M10-04</strong> in Mirpur. Test live spot location, monthly lease ledger, and <strong>download official verified QR license PDF</strong>.
                  </div>
                </div>
                <div className="sv-guest-tile-btn">
                  Enter Merchant Desk →
                </div>
              </div>

              <div 
                className="sv-guest-tile admin"
                onClick={() => { enterDemoMode('admin'); navigate('/admin'); }}
              >
                <div>
                  <div className="sv-guest-tile-role">Licensing Officer Actor</div>
                  <div className="sv-guest-tile-name">Tanvir Ahmed</div>
                  <div className="sv-guest-tile-desc">
                    Municipal Oversight Panel. Audit polygon zone boundaries, review 2 pending merchant applications, and inspect unverified citizen spot reports.
                  </div>
                </div>
                <div className="sv-guest-tile-btn">
                  Enter Officer Desk →
                </div>
              </div>
            </div>
          </div>

          {/* Municipal Metrics Ledger Strip */}
          <div className="sv-metrics-strip">
            <div className="sv-metric-cell">
              <div className="sv-metric-num">5</div>
              <div className="sv-metric-label">Municipal Wards</div>
            </div>
            <div className="sv-metric-cell">
              <div className="sv-metric-num">8</div>
              <div className="sv-metric-label">Demarcated Spots</div>
            </div>
            <div className="sv-metric-cell">
              <div className="sv-metric-num">100%</div>
              <div className="sv-metric-label">QR License Sync</div>
            </div>
            <div className="sv-metric-cell">
              <div className="sv-metric-num">GPS</div>
              <div className="sv-metric-label">Live Telemetry</div>
            </div>
          </div>

          {/* Spot Directory Search & Controls */}
          <div>
            <div className="sv-directory-header">
              <h3 className="sv-directory-title">
                Active Demarcated Spots ({filteredVendors.length})
              </h3>
              
              <button 
                onClick={() => setIsReporting(!isReporting)}
                className="btn btn-sm font-monospace"
                style={{
                  background: isReporting ? 'var(--sv-danger)' : 'var(--sv-bg-card)',
                  color: isReporting ? '#fff' : 'var(--sv-ink)',
                  border: '1px solid var(--sv-border)',
                  fontSize: '11px',
                  borderRadius: 2
                }}
              >
                {isReporting ? '✕ Cancel Report' : '🚩 Report Unofficial Spot'}
              </button>
            </div>

            {/* Reporting Form Docket (If Open) */}
            {isReporting && (
              <div className="mt-3 p-3 mb-3" style={{ background: 'var(--sv-bg-card)', border: '2px solid var(--sv-danger)' }}>
                <div className="d-flex align-items-center justify-content-between mb-2 pb-2" style={{ borderBottom: '1px solid var(--sv-border-light)' }}>
                  <span className="font-monospace fw-bold" style={{ color: 'var(--sv-danger)', fontSize: '11.5px' }}>
                    🚩 CITIZEN SPOT GRIEVANCE / REPORT FORM
                  </span>
                  <span className="font-monospace text-muted" style={{ fontSize: '10px' }}>
                    Click map to pin GPS coordinates
                  </span>
                </div>

                {reportSuccess ? (
                  <div className="alert alert-success py-2 font-monospace" style={{ fontSize: '12px', borderRadius: 2 }}>
                    ✓ Report recorded in municipal audit queue!
                  </div>
                ) : (
                  <div>
                    {reportDraft ? (
                      <div className="font-monospace mb-2 p-1" style={{ background: 'var(--sv-bg-muted)', fontSize: '11px', border: '1px solid var(--sv-border-light)' }}>
                        📍 Pinned GPS: <strong>{reportDraft[0].toFixed(5)}, {reportDraft[1].toFixed(5)}</strong>
                      </div>
                    ) : (
                      <p className="font-monospace text-danger mb-2" style={{ fontSize: '11px' }}>
                        * Please click anywhere on the Cartography Canvas to select the exact spot coordinates.
                      </p>
                    )}

                    <div className="row g-2 mb-2">
                      <div className="col-sm-6">
                        <label className="font-monospace small mb-1" style={{ fontSize: '10px' }}>VENDOR / SPOT NAME *</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm"
                          placeholder="e.g. Unregistered Fuchka Cart"
                          value={reportData.vendor_name}
                          onChange={e => setReportData({ ...reportData, vendor_name: e.target.value })}
                        />
                      </div>
                      <div className="col-sm-6">
                        <label className="font-monospace small mb-1" style={{ fontSize: '10px' }}>COMMERCE CATEGORY</label>
                        <select 
                          className="form-select form-select-sm"
                          value={reportData.category}
                          onChange={e => setReportData({ ...reportData, category: e.target.value })}
                        >
                          <option value="">Select Category</option>
                          <option value="Tea/Coffee">Tea & Beverages</option>
                          <option value="Snacks/Street Food">Snacks & Street Food</option>
                          <option value="Fruit/Juice">Fresh Fruit & Juice</option>
                          <option value="Vegetables">Vegetables & Produce</option>
                          <option value="Clothing/Goods">Clothing & Accessories</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="font-monospace small mb-1" style={{ fontSize: '10px' }}>REPORTER ALIAS / PHONE (OPTIONAL)</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="e.g. Concerned Pedestrian / Local Resident"
                        value={reportData.reported_by_name}
                        onChange={e => setReportData({ ...reportData, reported_by_name: e.target.value })}
                      />
                    </div>

                    <button 
                      onClick={handleSubmitReport}
                      disabled={!reportDraft || !reportData.vendor_name}
                      className="btn sv-btn-primary btn-sm w-100 font-monospace"
                    >
                      Submit Official Grievance Record
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Filter Search Bar & Filter Buttons */}
            <div className="d-flex flex-column gap-2 mt-3 mb-3">
              <input 
                type="text" 
                className="form-control form-control-sm"
                placeholder="Search spot code, merchant, or area (e.g. M10-04, Mirpur, Malek)..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ fontSize: '13px' }}
              />

              <div className="sv-filter-tabs">
                {[
                  { key: 'all', label: 'All Records' },
                  { key: 'good', label: 'High Public Trust' },
                  { key: 'reasonable', label: 'Fair Reputation' },
                  { key: 'worst', label: 'Flagged Spots' }
                ].map(tab => (
                  <button 
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`sv-filter-btn ${filter === tab.key ? 'active' : ''}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Card List */}
            <div className="sv-spot-list-scroll">
              {loading ? (
                <div className="text-center py-4 font-monospace">
                  <div className="spinner-border spinner-border-sm text-dark mb-2"></div>
                  <div className="small text-muted">Retrieving municipal spot registry...</div>
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="p-4 text-center font-monospace" style={{ background: 'var(--sv-bg-card)', border: '1px solid var(--sv-border)' }}>
                  No spots matching query "{search}".
                </div>
              ) : (
                filteredVendors.map(v => (
                  <VendorPublicCard
                    key={v.vendor_id || v.id}
                    vendor={v}
                    isFavorite={favorites.includes(v.vendor_id || v.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onRate={handleRate}
                    onSelect={handleSelectVendor}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Live GIS Cartography Canvas */}
        <section className="sv-cartography-canvas">
          {/* Canvas Meta Header */}
          <div className="sv-map-ledger-bar">
            <div className="d-flex align-items-center gap-2">
              <span style={{ color: '#C58A2B' }}>●</span>
              <span>LIVE GIS ALLOCATION CANVAS — DHAKA METROPOLITAN</span>
            </div>
            <div className="d-none d-md-block text-muted">
              COORDINATES: {mapCenter[0].toFixed(4)}°N, {mapCenter[1].toFixed(4)}°E
            </div>
          </div>

          <div className="sv-map-inner-wrap">
            {/* Quick Ward Navigation Bar */}
            <div className="sv-map-ward-selector">
              <span className="font-monospace text-muted" style={{ fontSize: '10px', alignSelf: 'center' }}>
                WARDE:
              </span>
              <button onClick={() => jumpToWard(23.8068, 90.3687, 16)} className="sv-ward-jump-btn">
                Mirpur-10
              </button>
              <button onClick={() => jumpToWard(23.7516, 90.3938, 16)} className="sv-ward-jump-btn">
                Karwan Bazar
              </button>
              <button onClick={() => jumpToWard(23.7533, 90.3769, 16)} className="sv-ward-jump-btn">
                Dhanmondi
              </button>
              <button onClick={() => jumpToWard(23.7104, 90.4074, 16)} className="sv-ward-jump-btn">
                Old Dhaka
              </button>
              <button onClick={() => jumpToWard(23.8103, 90.4125, 13)} className="sv-ward-jump-btn">
                Reset View
              </button>
            </div>

            {/* Embedded Interactive ZoneMap */}
            <ZoneMap
              spotMarkers={spotMarkers}
              viewOnly={!isReporting}
              hideDefaultLegend={true}
              onPick={isReporting ? handlePointPick : null}
              selectedPolygon={reportDraft ? [reportDraft] : []}
              height="100%"
              center={mapCenter}
              zoom={mapZoom}
              key={`map-${mapZoom}-${mapCenter[0]}`}
            />

            {/* Map Legend */}
            <div className="sv-canvas-legend">
              <div className="fw-bold mb-1">CIVIC SPOT STATUS</div>
              <div className="d-flex flex-column gap-1">
                <div className="d-flex align-items-center gap-2">
                  <span style={{ width: 9, height: 9, background: '#0D6942', display: 'inline-block' }}></span>
                  <span>Approved & Trusted Spot</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ width: 9, height: 9, background: '#C58A2B', display: 'inline-block' }}></span>
                  <span>Active Demarcation</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ width: 9, height: 9, background: '#C8372D', display: 'inline-block' }}></span>
                  <span>Unverified / Citizen Report</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Auth Modal for Login/Register */}
      <AuthModal
        isOpen={!!authMode}
        initialMode={authMode || 'login'}
        onClose={() => setAuthMode(null)}
        onSuccess={handleDashboardRedirect}
      />
    </div>
  );
}
