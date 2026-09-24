import { useState, useEffect } from 'react';
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

  const [authMode, setAuthMode] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mobileTab, setMobileTab] = useState('map');
  const [isDeckMinimized, setIsDeckMinimized] = useState(false);
  const base = import.meta.env.VITE_API_URL;

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
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [activeWard, setActiveWard] = useState('all');
  const [isReporting, setIsReporting] = useState(false);
  const [reportData, setReportData] = useState({
    vendor_name: '',
    category: '',
    reported_by_name: '',
    comment: ''
  });
  const [reportDraft, setReportDraft] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(false);

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
    setSelectedVendor(vendor);
    const lat = vendor.spots?.latitude ?? vendor.latitude;
    const lng = vendor.spots?.longitude ?? vendor.longitude;
    if (lat && lng) {
      setMapCenter([parseFloat(lat), parseFloat(lng)]);
      setMapZoom(17);
      if (window.innerWidth < 992) setMobileTab('map');
    }
  };

  const handleSelectSpotMarker = (spot) => {
    const matched = vendors.find(v => {
      const vSpotId = v.spots?.id || v.id;
      const vSpotNum = v.spots?.spot_number;
      return vSpotId === spot.id || (vSpotNum && vSpotNum === spot.spot_number);
    });
    if (matched) handleSelectVendor(matched);
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
    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'tea') return nameStr.includes('tea') || nameStr.includes('coffee') || nameStr.includes('fuchka') || zoneStr.includes('tea');
    if (filter === 'fruit') return nameStr.includes('fruit') || nameStr.includes('juice') || zoneStr.includes('fruit');
    if (filter === 'snacks') return nameStr.includes('pitha') || nameStr.includes('snack') || nameStr.includes('biryani') || nameStr.includes('food');
    if (filter === 'goods') return nameStr.includes('wear') || nameStr.includes('bag') || nameStr.includes('craft') || nameStr.includes('apparel');
    const r = v.ratings || { good: 0, reasonable: 0, worst: 0 };
    const max = Math.max(r.good, r.reasonable, r.worst);
    if (max === 0) return true;
    if (filter === 'good') return r.good === max;
    if (filter === 'reasonable') return r.reasonable === max;
    if (filter === 'worst') return r.worst === max;
    return true;
  });

  const spotMarkers = vendors.map(v => {
    const r = v.ratings || { good: 0, reasonable: 0, worst: 0 };
    const max = Math.max(r.good, r.reasonable, r.worst);
    let displayColor = null;
    if (max > 0) {
      if (r.good === max) displayColor = '#16A34A';
      else if (r.reasonable === max) displayColor = '#D97706';
      else displayColor = '#DC2626';
    }
    return {
      ...v.spots,
      latitude: v.spots?.latitude ?? v.latitude,
      longitude: v.spots?.longitude ?? v.longitude,
      spot_number: v.spots?.spot_number || (v.is_guest_report ? 'REPORT' : 'SPOT'),
      status: v.is_guest_report ? 'unverified' : (v.spots?.status || 'occupied'),
      vendor_name: v.profiles?.business_name || v.profiles?.full_name || v.vendor_name,
      operating_hours: v.profiles?.operating_hours,
      ratings: r,
      displayColor
    };
  });

  const jumpToWard = (wardName, lat, lng, zoomLevel = 15) => {
    setActiveWard(wardName);
    setMapCenter([lat, lng]);
    setMapZoom(zoomLevel);
  };

  const CATEGORIES = [
    { key: 'all', icon: '🗺️', label: 'All Spots' },
    { key: 'tea', icon: '🍵', label: 'Tea & Snacks' },
    { key: 'fruit', icon: '🍊', label: 'Fruit & Juice' },
    { key: 'snacks', icon: '🍲', label: 'Street Food' },
    { key: 'goods', icon: '🧵', label: 'Crafts & Goods' },
  ];

  const WARDS = [
    { key: 'mirpur', label: 'Mirpur-10', lat: 23.8068, lng: 90.3687 },
    { key: 'karwan', label: 'Karwan Bazar', lat: 23.7516, lng: 90.3938 },
    { key: 'dhanmondi', label: 'Dhanmondi', lat: 23.7533, lng: 90.3769 },
    { key: 'olddhaka', label: 'Old Dhaka', lat: 23.7104, lng: 90.4074 },
    { key: 'all', label: 'Full Dhaka View', lat: 23.8103, lng: 90.4125, zoom: 13 },
  ];

  return (
    <div className="sv-landing-shell">
      {/* ─── Sticky Navbar ─────────────────────────────────── */}
      <header className="sv-landing-header">
        <div className="sv-brand-group">
          <div className="sv-brand-badge" title="Dhaka Metropolitan Municipal Spatial Registry">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              <line x1="8" y1="2" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
          </div>
          <div>
            <div className="sv-brand-name">StreetVendor BD</div>
            <div className="sv-brand-tag" style={{ borderLeft: 'none', paddingLeft: 0, fontSize: '10px' }}>
              Municipal Spatial Registry
            </div>
          </div>
          <div className="sv-telemetry-badge" style={{ marginLeft: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#1E4A4A', background: '#EBF5F5', border: '1px solid #A8CFCF', padding: '4px 10px', borderRadius: '100px' }}>
            <span className="sv-pulse-dot"></span>
            <span className="d-none d-md-inline">DhCC GIS · LIVE</span>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {user ? (
            <button onClick={handleDashboardRedirect} className="btn btn-primary btn-sm" style={{ borderRadius: '50px', padding: '6px 14px' }}>
              {isDemo ? '⭐ Active Session' : 'Enter Portal →'}
            </button>
          ) : (
            <>
              {/* Desktop Demo Buttons */}
              <button
                onClick={() => { enterDemoMode('vendor'); navigate('/vendor'); }}
                className="btn btn-primary btn-sm d-none d-md-inline-flex"
                style={{ background: 'linear-gradient(135deg,#1E4A4A,#2D6060)', borderRadius: '50px', padding: '6px 14px', gap: '6px' }}
              >
                <span>🏪</span>
                <span>Merchant Demo</span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px', fontFamily: 'Space Mono, monospace' }}>#M10-04</span>
              </button>
              <button
                onClick={() => { enterDemoMode('admin'); navigate('/admin'); }}
                className="btn btn-outline-dark btn-sm d-none d-sm-inline-flex"
                style={{ borderRadius: '50px', padding: '6px 12px' }}
              >
                🏛️ Officer Demo
              </button>

              {/* Mobile Quick Demo Button */}
              <button
                onClick={() => { enterDemoMode('admin'); navigate('/admin'); }}
                className="btn btn-sm d-inline-flex d-sm-none"
                style={{ background: 'var(--sv-primary-light)', border: '1px solid var(--sv-primary-border)', color: 'var(--sv-primary)', borderRadius: '50px', padding: '5px 10px', fontSize: '11.5px', fontWeight: 600 }}
              >
                ⚡ Demo
              </button>

              {/* Universal Sign In Button */}
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary btn-sm"
                style={{ borderRadius: '50px', padding: '5px 13px', fontSize: '12px' }}
              >
                Sign In
              </button>
            </>
          )}
        </nav>
      </header>

      {/* ─── Mobile Segmented Tab ────────────────────────── */}
      <div className="sv-mobile-segmented-nav">
        <button className={`sv-segmented-btn ${mobileTab === 'map' ? 'active' : ''}`} onClick={() => setMobileTab('map')}>
          🗺️ Map View
        </button>
        <button className={`sv-segmented-btn ${mobileTab === 'list' ? 'active' : ''}`} onClick={() => setMobileTab('list')}>
          📋 Spots ({filteredVendors.length})
        </button>
      </div>

      {/* ─── Main GIS Workspace (Unified Immersive Canvas) ─ */}
      <main id="sv-gis-map-anchor" className={`sv-gis-workspace view-${mobileTab}`}>

        {/* Full-canvas map */}
        <section className="sv-gis-canvas">

          {/* Floating Pill when Deck is Minimized */}
          {isDeckMinimized && (
            <button
              className="sv-deck-restore-pill"
              onClick={() => setIsDeckMinimized(false)}
              title="Show Platform Overview & Spot Registry"
            >
              <span>🏛️</span>
              <span>Explore Vending Ledger &amp; Spots ({filteredVendors.length})</span>
              <span style={{ fontSize: '11px', opacity: 0.8 }}>▲</span>
            </button>
          )}

          {/* Ward Jump Toolbar */}
          <div className="sv-gis-toolbar">
            <span className="sv-gis-tool-label">METRO WARDS</span>
            {WARDS.map(w => (
              <button
                key={w.key}
                onClick={() => jumpToWard(w.key, w.lat, w.lng, w.zoom || 16)}
                className={`sv-gis-tool-btn ${activeWard === w.key ? 'active' : ''}`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Floating Spot Dossier */}
          {selectedVendor && (
            <div className="sv-floating-spot-dossier">
              <div className="sv-dossier-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="sv-spot-tag">
                    #{selectedVendor.spots?.spot_number || 'SPOT'}
                  </span>
                  <span className={`sv-badge ${selectedVendor.is_guest_report ? 'sv-badge-danger' : 'sv-badge-success'}`}>
                    {selectedVendor.is_guest_report ? 'Citizen Report' : '✓ Verified'}
                  </span>
                </div>
                <button className="sv-dossier-close" onClick={() => setSelectedVendor(null)}>✕</button>
              </div>

              <h4 style={{ margin: '4px 0', fontSize: '16px', fontWeight: 800, color: '#322D29', letterSpacing: '-0.03em' }}>
                {selectedVendor.profiles?.business_name || selectedVendor.profiles?.full_name || selectedVendor.vendor_name}
              </h4>

              <div style={{ fontSize: '12px', color: '#4A6E6E', marginBottom: '10px' }}>
                📍 {selectedVendor.spots?.zones?.name || 'Dhaka Metropolitan'}
                {selectedVendor.spots?.zones?.area ? ` · ${selectedVendor.spots.zones.area}` : ''}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <span style={{ color: '#EAB308', fontSize: '13px' }}>★ ★ ★ ★ ★</span>
                <strong style={{ fontSize: '12.5px', color: '#322D29' }}>4.9</strong>
                <span style={{ fontSize: '11px', color: '#7A7268' }}>· 94% Public Trust</span>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                padding: '10px 12px', background: '#F0EBE5', borderRadius: '12px',
                fontSize: '11.5px', marginBottom: '12px'
              }}>
                <div>
                  <span style={{ color: '#4A6E6E', display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Monthly Lease</span>
                  <strong style={{ fontFamily: 'Space Mono, monospace', fontSize: '13px', color: '#1E4A4A' }}>
                    ৳{Number(selectedVendor.rent_amount || 3500).toLocaleString()}/mo
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#4A6E6E', display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Operating Hours</span>
                  <strong style={{ fontSize: '11px', color: '#322D29' }}>
                    {selectedVendor.profiles?.operating_hours || '07:00 AM – 10:30 PM'}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => { enterDemoMode('vendor'); navigate('/vendor'); }}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, fontSize: '12px', fontWeight: 700, borderRadius: '50px', background: 'linear-gradient(135deg,#1E4A4A,#2D6060)' }}
                >
                  Inspect in Demo →
                </button>
                <button
                  onClick={() => jumpToWard(
                    selectedVendor.spots?.zones?.name || '',
                    selectedVendor.spots?.latitude ?? selectedVendor.latitude,
                    selectedVendor.spots?.longitude ?? selectedVendor.longitude,
                    18
                  )}
                  className="btn btn-outline-dark btn-sm"
                  style={{ fontSize: '12px', borderRadius: '50px' }}
                  title="Zoom in"
                >
                  🔍 Zoom
                </button>
              </div>
            </div>
          )}

          {/* Map */}
          <ZoneMap
            spotMarkers={spotMarkers}
            selectedSpotId={selectedVendor?.spots?.id || selectedVendor?.id}
            onSpotSelect={handleSelectSpotMarker}
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
          <div className="sv-gis-legend">
            {[
              { color: '#16A34A', label: 'Approved & Trusted' },
              { color: '#D97706', label: 'Active Demarcation' },
              { color: '#DC2626', label: 'Citizen Report' },
            ].map(l => (
              <div key={l.color} className="sv-legend-item">
                <span className="sv-dot-indicator" style={{ backgroundColor: l.color }}></span>
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Floating Apple-Grade Discovery Deck ───── */}
        <aside className={`sv-discovery-pane ${isDeckMinimized ? 'is-minimized' : ''}`}>
          <div className="sv-pane-content">

            {/* Apple-Grade Civic Intro & Control Card */}
            <div className="sv-deck-hero-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div className="sv-intro-civic-badge" style={{ padding: '3px 10px', fontSize: '10.5px' }}>
                  <span>🏛️</span>
                  <span>DCC GIS REGISTRY 2025</span>
                </div>
                <button
                  onClick={() => setIsDeckMinimized(true)}
                  className="sv-deck-minimize-btn"
                  title="Minimize deck to maximize map view"
                >
                  ✕
                </button>
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E4A4A', letterSpacing: '-0.03em', margin: '0 0 5px', lineHeight: 1.2 }}>
                Digital Spatial Ledger &amp; <span className="sv-editorial-accent">Verified Registry</span>
              </h2>

              <p style={{ fontSize: '12px', color: '#5A524A', lineHeight: 1.45, margin: '0 0 12px' }}>
                Authoritative Dhaka City Corporation platform digitising designated street vending spots, QR permits, and public trust scores.
              </p>

              {/* Quick Demo Access Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <button
                  onClick={() => { enterDemoMode('vendor'); navigate('/vendor'); }}
                  className="btn btn-primary btn-sm"
                  style={{
                    fontSize: '11.5px', padding: '7px 10px', borderRadius: '50px',
                    background: 'linear-gradient(135deg, #1E4A4A 0%, #2D6060 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                  }}
                  title="Try Rahim's Spot M10-04"
                >
                  <span>🏪</span>
                  <span>Merchant #M10-04</span>
                </button>
                <button
                  onClick={() => { enterDemoMode('admin'); navigate('/admin'); }}
                  className="btn btn-outline-dark btn-sm"
                  style={{ fontSize: '11.5px', padding: '7px 10px', borderRadius: '50px' }}
                  title="Try Officer Desk"
                >
                  🏛️ Officer Demo
                </button>
              </div>

              {/* 4 Key Metric Chips */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                background: 'rgba(255, 255, 255, 0.8)', border: '1px solid var(--sv-border-subtle)',
                borderRadius: '12px', padding: '8px 4px', textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E4A4A', lineHeight: 1 }}>{vendors.length || 8}+</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#7A7268', textTransform: 'uppercase', marginTop: '2px' }}>Spots</div>
                </div>
                <div style={{ borderLeft: '1px solid var(--sv-border-subtle)' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E4A4A', lineHeight: 1 }}>94%</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#7A7268', textTransform: 'uppercase', marginTop: '2px' }}>Trust</div>
                </div>
                <div style={{ borderLeft: '1px solid var(--sv-border-subtle)' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E4A4A', lineHeight: 1 }}>6 Wards</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#7A7268', textTransform: 'uppercase', marginTop: '2px' }}>Metro</div>
                </div>
                <div style={{ borderLeft: '1px solid var(--sv-border-subtle)' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E4A4A', lineHeight: 1 }}>100%</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#7A7268', textTransform: 'uppercase', marginTop: '2px' }}>Digital</div>
                </div>
              </div>
            </div>

            {/* Category Filters */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setFilter(cat.key)}
                  className={`sv-filter-pill ${filter === cat.key ? 'active' : ''}`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="sv-search-wrap">
              <span className="sv-search-icon">🔍</span>
              <input
                type="text"
                className="sv-search-input"
                placeholder="Search stall name, ward or spot ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ borderRadius: '50px', paddingLeft: '36px' }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#AC9C8D', cursor: 'pointer', fontSize: '13px' }}
                >✕</button>
              )}
            </div>

            {/* Directory Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#322D29' }}>
                Vending Spots <span style={{ fontWeight: 400, color: '#7A7268', fontSize: '12px' }}>({filteredVendors.length})</span>
              </div>
              <button
                onClick={() => setIsReporting(!isReporting)}
                style={{
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  background: isReporting ? '#FAF1F2' : 'transparent',
                  border: `1.5px solid ${isReporting ? '#D4A5A8' : '#D1C7BD'}`,
                  color: isReporting ? '#72383D' : '#4A6E6E',
                  borderRadius: '50px', padding: '4px 12px',
                  fontFamily: 'Space Grotesk, sans-serif'
                }}
              >
                {isReporting ? '✕ Cancel' : '+ Report Stall'}
              </button>
            </div>

            {/* Citizen Report Form */}
            {isReporting && (
              <div className="sv-report-panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#72383D' }}>🚩 Report Unofficial Stall</span>
                  <span style={{ fontSize: '10.5px', color: '#7A7268' }}>Click map to pin</span>
                </div>
                {reportSuccess ? (
                  <div style={{ padding: '8px 12px', backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: '8px', fontSize: '11.5px', fontWeight: 600 }}>
                    ✓ Report submitted to municipal queue!
                  </div>
                ) : (
                  <div>
                    {reportDraft ? (
                      <div style={{ fontSize: '10.5px', marginBottom: '8px', padding: '4px 8px', backgroundColor: '#FAF1F2', borderRadius: '6px', border: '1px solid #D4A5A8', color: '#72383D', fontFamily: 'Space Mono, monospace' }}>
                        📍 {reportDraft[0].toFixed(5)}°N, {reportDraft[1].toFixed(5)}°E
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#72383D', marginBottom: '8px' }}>* Click anywhere on the map to pin location.</div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                      <input type="text" className="form-control form-control-sm" placeholder="Stall or Vendor Name *" value={reportData.vendor_name} onChange={e => setReportData({ ...reportData, vendor_name: e.target.value })} style={{ borderRadius: '6px', fontSize: '12px' }} />
                      <select className="form-select form-select-sm" value={reportData.category} onChange={e => setReportData({ ...reportData, category: e.target.value })} style={{ borderRadius: '6px', fontSize: '12px' }}>
                        <option value="">Category</option>
                        <option value="Tea/Coffee">Tea & Beverages</option>
                        <option value="Snacks/Street Food">Snacks & Food</option>
                        <option value="Fruit/Juice">Fruit & Juice</option>
                        <option value="Clothing/Goods">Clothing & Goods</option>
                      </select>
                    </div>
                    <input type="text" className="form-control form-control-sm mb-2" placeholder="Your Name / Alias (Optional)" value={reportData.reported_by_name} onChange={e => setReportData({ ...reportData, reported_by_name: e.target.value })} style={{ borderRadius: '6px', fontSize: '12px' }} />
                    <button
                      onClick={handleSubmitReport}
                      disabled={!reportDraft || !reportData.vendor_name}
                      style={{
                        width: '100%', padding: '8px', fontSize: '12px', fontWeight: 700,
                        borderRadius: '50px', border: 'none', cursor: 'pointer',
                        background: (!reportDraft || !reportData.vendor_name) ? '#D1C7BD' : '#72383D',
                        color: '#FFFFFF', fontFamily: 'Space Grotesk, sans-serif'
                      }}
                    >
                      Submit Report
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Spot Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#4A6E6E', fontSize: '13px' }}>
                  <div style={{ fontSize: '22px', marginBottom: '8px' }}>⏳</div>
                  Loading municipal spots…
                </div>
              ) : filteredVendors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#4A6E6E', fontSize: '13px' }}>
                  <div style={{ fontSize: '22px', marginBottom: '8px' }}>🔍</div>
                  No spots matching your query.
                </div>
              ) : (
                filteredVendors.map(v => (
                  <VendorPublicCard
                    key={v.vendor_id || v.id}
                    vendor={v}
                    isSelected={selectedVendor && ((selectedVendor.id && selectedVendor.id === v.id) || (selectedVendor.vendor_id && selectedVendor.vendor_id === (v.vendor_id || v.id)))}
                    isFavorite={favorites.includes(v.vendor_id || v.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onRate={handleRate}
                    onSelect={handleSelectVendor}
                  />
                ))
              )}
            </div>

            {/* Pane Footer */}
            <div style={{ paddingTop: '8px', borderTop: '1px solid #E8E0D8', textAlign: 'center' }}>
              <p style={{ fontSize: '10.5px', color: '#AC9C8D', margin: 0, lineHeight: 1.5 }}>
                Powered by <strong style={{ color: '#1E4A4A' }}>Dhaka City Corporation GIS</strong><br />
                © 2025 StreetVendor BD · All data verified by municipal authority
              </p>
            </div>

          </div>
        </aside>

      </main>

      {/* ─── Full Footer ─────────────────────────────────── */}
      <footer className="sv-site-footer">
        <div className="sv-footer-inner">

          {/* Brand Column */}
          <div className="sv-footer-brand-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '38px', height: '38px',
                background: 'linear-gradient(135deg,#1E4A4A,#2D6060)',
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em' }}>StreetVendor BD</div>
                <div style={{ fontSize: '10.5px', color: '#A8CFCF', fontWeight: 500 }}>Municipal Spatial Registry</div>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#8AACAC', lineHeight: 1.6, margin: '0 0 16px', maxWidth: '260px' }}>
              An authoritative geospatial platform digitising designated urban vending locations, trade permits, and public trust records across Dhaka City Corporation.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { icon: '🏛️', label: 'DCC Certified' },
                { icon: '🔒', label: 'Secure Platform' },
              ].map(b => (
                <div key={b.label} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '10.5px', fontWeight: 600, color: '#A8CFCF',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(168,207,207,0.2)',
                  padding: '4px 10px', borderRadius: '100px'
                }}>
                  <span>{b.icon}</span> {b.label}
                </div>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="sv-footer-links-grid">

            <div>
              <div className="sv-footer-col-title">Platform</div>
              <ul className="sv-footer-links">
                <li><a href="#" onClick={() => setAuthMode('register')}>Register as Vendor</a></li>
                <li><a href="#" onClick={() => setAuthMode('login')}>Sign In to Portal</a></li>
                <li><a href="#" onClick={() => { enterDemoMode('vendor'); navigate('/vendor'); }}>Try Merchant Demo</a></li>
                <li><a href="#" onClick={() => { enterDemoMode('admin'); navigate('/admin'); }}>Try Officer Demo</a></li>
              </ul>
            </div>

            <div>
              <div className="sv-footer-col-title">Coverage</div>
              <ul className="sv-footer-links">
                {WARDS.filter(w => w.key !== 'all').map(w => (
                  <li key={w.key}>
                    <a href="#" onClick={(e) => { e.preventDefault(); jumpToWard(w.key, w.lat, w.lng, 16); window.scrollTo({top: 0, behavior: 'smooth'}); }}>
                      {w.label}
                    </a>
                  </li>
                ))}
                <li><a href="#" onClick={(e) => { e.preventDefault(); jumpToWard('all', 23.8103, 90.4125, 13); window.scrollTo({top: 0, behavior: 'smooth'}); }}>View All Wards</a></li>
              </ul>
            </div>

            <div>
              <div className="sv-footer-col-title">About the Project</div>
              <ul className="sv-footer-links">
                <li><span style={{ color: '#6A9090', cursor: 'default' }}>Research Thesis 2025</span></li>
                <li><span style={{ color: '#6A9090', cursor: 'default' }}>Urban Informatics Lab</span></li>
                <li><span style={{ color: '#6A9090', cursor: 'default' }}>GIS & Smart City Division</span></li>
                <li><span style={{ color: '#6A9090', cursor: 'default' }}>Dhaka City Corporation</span></li>
              </ul>
            </div>

            <div>
              <div className="sv-footer-col-title">Contact & Support</div>
              <ul className="sv-footer-links">
                <li>
                  <span style={{ color: '#8AACAC', fontSize: '12px' }}>
                    📧 streetvendor@dhcc.gov.bd
                  </span>
                </li>
                <li>
                  <span style={{ color: '#8AACAC', fontSize: '12px' }}>
                    📞 +880-2-9550062
                  </span>
                </li>
                <li>
                  <span style={{ color: '#8AACAC', fontSize: '12px' }}>
                    🏢 Nagar Bhaban, Fulbaria
                  </span>
                </li>
                <li>
                  <span style={{ color: '#8AACAC', fontSize: '12px' }}>
                    🕐 Sun–Thu: 9AM–5PM
                  </span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="sv-footer-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="sv-pulse-dot" style={{ backgroundColor: '#16A34A' }}></span>
            <span>System Operational · {vendors.length || 8} spots indexed · OpenStreetMap GIS tiles</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>© 2025 StreetVendor BD</span>
            <a href="#" style={{ color: '#6A9090' }}>Privacy</a>
            <a href="#" style={{ color: '#6A9090' }}>Terms</a>
            <a href="#" style={{ color: '#6A9090' }}>Open Data</a>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={!!authMode}
        initialMode={authMode || 'login'}
        onClose={() => setAuthMode(null)}
        onSuccess={handleDashboardRedirect}
      />
    </div>
  );
}
