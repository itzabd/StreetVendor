import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/auth/AuthModal';
import RatingModal from '../components/RatingModal';
import ZoneMap from '../components/ZoneMap';
import VendorPublicCard from '../components/VendorPublicCard';
import axios from 'axios';

export default function LandingPage() {
  const { user, profile, enterDemoMode, isDemo, getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const useServerFavorites = !!user && !isDemo;

  const [authMode, setAuthMode] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [userRatings, setUserRatings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sv_guest_ratings') || '{}');
    } catch {
      return {};
    }
  });
  const [ratingModalVendor, setRatingModalVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mobileTab, setMobileTab] = useState('overview');
  const [isDeckMinimized, setIsDeckMinimized] = useState(false);
  const [showDesktopPillars, setShowDesktopPillars] = useState(false);
  const base = import.meta.env.VITE_API_URL;

  const toolbarRef = useRef(null);
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleToolbarMouseDown = (e) => {
    e.stopPropagation();
    setIsDraggingToolbar(true);
    setStartX(e.pageX - (toolbarRef.current?.offsetLeft || 0));
    setScrollLeft(toolbarRef.current?.scrollLeft || 0);
  };

  const handleToolbarMouseMove = (e) => {
    if (!isDraggingToolbar) return;
    e.preventDefault();
    e.stopPropagation();
    const x = e.pageX - (toolbarRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    if (toolbarRef.current) {
      toolbarRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleToolbarMouseUp = () => {
    setIsDraggingToolbar(false);
  };

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
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    if (mode === 'login' || mode === 'register') {
      setAuthMode(mode);
    }
  }, [location.search]);

  useEffect(() => {
    fetchVendors();
    if (useServerFavorites) fetchFavorites();
    else loadGuestFavorites();
  }, [user, isDemo]);

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
      const token = await getToken();
      if (!token) {
        loadGuestFavorites();
        return;
      }
      const res = await axios.get(`${base}/public/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch favorites', err);
      loadGuestFavorites();
    }
  };

  const loadGuestFavorites = () => {
    try {
      const local = localStorage.getItem('sv_guest_favorites');
      if (local) {
        const parsed = JSON.parse(local);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      } else {
        setFavorites([]);
      }
    } catch {
      setFavorites([]);
    }
  };

  const handleToggleFavorite = async (vendorId) => {
    if (!useServerFavorites) {
      setFavorites(prev => {
        const newFavs = prev.includes(vendorId)
          ? prev.filter(id => id !== vendorId)
          : [...prev, vendorId];
        try {
          localStorage.setItem('sv_guest_favorites', JSON.stringify(newFavs));
        } catch (e) {
          console.error('Failed to save to localStorage', e);
        }
        return newFavs;
      });
      return;
    }
    try {
      const token = await getToken();
      if (!token) return;
      const res = await axios.post(`${base}/public/favorite`, { vendor_id: vendorId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.favorite) {
        setFavorites(prev => prev.includes(vendorId) ? prev : [...prev, vendorId]);
      } else {
        setFavorites(prev => prev.filter(id => id !== vendorId));
      }
    } catch (err) {
      console.error('Favorite toggle failed', err);
    }
  };

  const handleSubmitRating = async (vendorId, stars, tags = [], comment = '') => {
    const ratingType = stars >= 4 ? 'good' : (stars === 3 ? 'reasonable' : 'worst');

    // 1. Save locally for instant guest feedback
    try {
      const stored = JSON.parse(localStorage.getItem('sv_guest_ratings') || '{}');
      stored[vendorId] = { stars, tags, comment, timestamp: Date.now() };
      localStorage.setItem('sv_guest_ratings', JSON.stringify(stored));
      setUserRatings({ ...stored });
    } catch (e) {
      console.error(e);
    }

    // 2. Optimistically update vendors in state
    setVendors(prev => prev.map(v => {
      const id = v.vendor_id || v.id;
      if (id === vendorId) {
        const r = { ...(v.ratings || { good: 15, reasonable: 2, worst: 0 }) };
        r[ratingType] = (r[ratingType] || 0) + 1;
        r.total = ((r.good || 0) + (r.reasonable || 0) + (r.worst || 0) + 1);
        return { ...v, ratings: r };
      }
      return v;
    }));

    // 3. Update selectedVendor if dossier is open
    setSelectedVendor(prev => {
      if (!prev) return null;
      const id = prev.vendor_id || prev.id;
      if (id === vendorId) {
        const r = { ...(prev.ratings || { good: 15, reasonable: 2, worst: 0 }) };
        r[ratingType] = (r[ratingType] || 0) + 1;
        r.total = ((r.good || 0) + (r.reasonable || 0) + (r.worst || 0) + 1);
        return { ...prev, ratings: r };
      }
      return prev;
    });

    // 4. Send to backend with optional auth
    try {
      await axios.post(`${base}/public/rate`, { 
        vendor_id: vendorId, 
        rating_type: ratingType, 
        rating: ratingType,
        comment: comment || (tags && tags.length > 0 ? tags.join(', ') : `${stars} stars review`)
      });
    } catch (err) {
      console.warn('Backend sync rating fallback to local', err);
    }
  };

  const handleRate = handleSubmitRating;

  const handleSelectVendor = (vendor) => {
    setSelectedVendor(vendor);
    const lat = vendor.spots?.latitude ?? vendor.latitude;
    const lng = vendor.spots?.longitude ?? vendor.longitude;
    if (lat && lng) {
      setMapCenter([parseFloat(lat), parseFloat(lng)]);
      setMapZoom(17);
      if (window.innerWidth < 992) {
        setMobileTab('map');
        document.getElementById('sv-gis-map-anchor')?.scrollIntoView({ behavior: 'smooth' });
      }
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
    if (filter === 'favorites') return favorites.includes(v.vendor_id || v.id);
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
    const isFav = favorites.includes(v.vendor_id || v.id);
    return {
      ...v.spots,
      latitude: v.spots?.latitude ?? v.latitude,
      longitude: v.spots?.longitude ?? v.longitude,
      spot_number: v.spots?.spot_number || (v.is_guest_report ? 'REPORT' : 'SPOT'),
      status: v.is_guest_report ? 'unverified' : (v.spots?.status || 'occupied'),
      vendor_name: v.profiles?.business_name || v.profiles?.full_name || v.vendor_name,
      operating_hours: v.profiles?.operating_hours,
      ratings: r,
      displayColor,
      isFavorite: isFav
    };
  });

  const jumpToWard = (wardName, lat, lng, zoomLevel = 15) => {
    setActiveWard(wardName);
    setMapCenter([lat, lng]);
    setMapZoom(zoomLevel);
  };

  const CATEGORIES = [
    { key: 'all', icon: '🗺️', label: 'All Spots' },
    { key: 'favorites', icon: '⭐', label: `Saved (${favorites.length})` },
    { key: 'tea', icon: '🍵', label: 'Tea & Snacks' },
    { key: 'fruit', icon: '🍊', label: 'Fruit & Juice' },
    { key: 'snacks', icon: '🍲', label: 'Street Food' },
    { key: 'goods', icon: '🧵', label: 'Crafts & Goods' },
  ];

  const WARDS = [
    { key: 'all', label: 'All Dhaka', lat: 23.8103, lng: 90.4125, zoom: 13, icon: '🏙️' },
    { key: 'mirpur', label: 'Mirpur-10', lat: 23.8068, lng: 90.3687, icon: '📍' },
    { key: 'karwan', label: 'Karwan Bazar', lat: 23.7516, lng: 90.3938, icon: '📍' },
    { key: 'dhanmondi', label: 'Dhanmondi', lat: 23.7533, lng: 90.3769, icon: '📍' },
    { key: 'olddhaka', label: 'Old Dhaka', lat: 23.7104, lng: 90.4074, icon: '📍' },
  ];

  const PLATFORM_FEATURES = [
    {
      icon: '📍',
      title: 'Official Safe Spots',
      tag: 'Safe Locations',
      desc: 'Approved street locations where favorite stalls operate legally without police harassment or sudden evictions.',
      accent: '#0D9488',
      bg: '#F0FDFA'
    },
    {
      icon: '🪪',
      title: 'Instant QR License',
      tag: 'Scan With Phone',
      desc: 'Scan any vendor’s QR code with your mobile camera to instantly check their real city permit and owner details.',
      accent: '#2563EB',
      bg: '#EFF6FF'
    },
    {
      icon: '⭐',
      title: 'Real Customer Ratings',
      tag: '1-Tap Reviews',
      desc: 'Rate food taste and hygiene, read real local opinions, and help good vendors grow their neighborhood trust.',
      accent: '#D97706',
      bg: '#FFFBEB'
    },
    {
      icon: '💳',
      title: 'Fair Fixed Rates',
      tag: 'No Middlemen',
      desc: 'Standardized municipal fees protect hard-working vendors from shady middlemen and informal extortion.',
      accent: '#059669',
      bg: '#ECFDF5'
    }
  ];

  const handleHeroAction = (action) => {
    if (action === 'map') {
      setMobileTab('map');
      const el = document.getElementById('sv-gis-map-anchor');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (action === 'spots') {
      setMobileTab('spots');
      const el = document.getElementById('sv-spots-directory-anchor');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderHeroAndFeatures = (isMobile) => (
    <div className={`sv-deck-hero-wrapper ${isMobile ? 'sv-mobile-hero-wrapper' : 'sv-desktop-hero-wrapper'}`}>
      {/* ─── Civic Hero Showcase Card ─── */}
      <div className="sv-deck-hero-card">
        {/* Authority Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div className="sv-intro-civic-badge">
            <span style={{ fontSize: '13px' }}>🏛️</span>
            <span>Dhaka City Corporation · Official Stalls</span>
          </div>

          {!isMobile ? (
            <button
              onClick={() => setIsDeckMinimized(true)}
              className="sv-deck-minimize-btn"
              title="Minimize panel to expand map view"
            >
              ✕
            </button>
          ) : (
            <div className="sv-live-badge-chip">
              <span className="sv-pulse-dot" style={{ width: '7px', height: '7px' }}></span>
              <span>LIVE MAP</span>
            </div>
          )}
        </div>

        {/* Catchy Headline */}
        <h1 className="sv-hero-title">
          Dhaka's Best Street Food &amp;{' '}
          <span className="sv-hero-accent-text">Verified Local Stalls</span>
        </h1>

        <p className="sv-hero-subtitle">
          Explore clean, verified street food and genuine local stalls near you. Rated by real foodies, officially permitted by city hall, with fair fixed prices.
        </p>

        {/* Primary Citizen & Explorer CTA Buttons (Only on Mobile POV where map is in a separate tab) */}
        {isMobile && (
          <div className="sv-hero-actions">
            <button
              type="button"
              onClick={() => handleHeroAction('map')}
              className="sv-hero-primary-btn"
            >
              <span>🗺️</span>
              <span>Open Food Map</span>
            </button>
            <button
              type="button"
              onClick={() => handleHeroAction('spots')}
              className="sv-hero-secondary-btn"
            >
              <span>🍔</span>
              <span>Browse All Stalls ({filteredVendors.length})</span>
            </button>
          </div>
        )}

        {/* Role Demo Switcher Strip (Only on Mobile POV - Desktop header already has both demo buttons) */}
        {isMobile && (
          <div className="sv-hero-demo-strip">
            <div className="sv-hero-demo-label">
              <span>⚡</span>
              <span>Try Role Demos:</span>
            </div>
            <div className="sv-hero-demo-pills">
              <button
                type="button"
                onClick={() => { enterDemoMode('vendor'); navigate('/vendor'); }}
                className="sv-hero-demo-pill"
                title="Try Rahim's stall portal (Spot M10-04)"
              >
                <span>🏪</span>
                <span>Vendor App (Rahim)</span>
              </button>
              <button
                type="button"
                onClick={() => { enterDemoMode('admin'); navigate('/admin'); }}
                className="sv-hero-demo-pill"
                title="Test City Officer Desk"
              >
                <span>🏛️</span>
                <span>City Inspector View</span>
              </button>
            </div>
          </div>
        )}

        {/* 4 Key Civic Metrics */}
        <div className="sv-metrics-four-grid">
          <div>
            <div className="sv-metric-num">{vendors.length || 11}+</div>
            <div className="sv-metric-tag">Trusted Stalls</div>
          </div>
          <div>
            <div className="sv-metric-num">94%</div>
            <div className="sv-metric-tag">Happy Foodies</div>
          </div>
          <div>
            <div className="sv-metric-num">6 Zones</div>
            <div className="sv-metric-tag">Across Dhaka</div>
          </div>
          <div>
            <div className="sv-metric-num">100%</div>
            <div className="sv-metric-tag">Fair Pricing</div>
          </div>
        </div>
      </div>

      {/* ─── Platform Capabilities (4 Pillars) ───── */}
      {!isMobile ? (
        /* On Desktop: Show a clean, compact toggle bar so search and stalls appear immediately without scrolling */
        <div style={{ marginTop: '8px' }}>
          <button
            type="button"
            onClick={() => setShowDesktopPillars(!showDesktopPillars)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FFFFFF',
              border: '1px solid rgba(30, 74, 74, 0.12)',
              borderRadius: '12px',
              padding: '8px 14px',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#1E4A4A',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🛡️</span>
              <span>Why Choose Verified Stalls? (4 City Pillars)</span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#7A7268' }}>{showDesktopPillars ? '▲ Hide' : '▼ Show'}</span>
          </button>

          {showDesktopPillars && (
            <div className="sv-platform-features-deck" style={{ marginTop: '8px' }}>
              <div className="sv-features-grid">
                {PLATFORM_FEATURES.map((feat, idx) => (
                  <div key={idx} className="sv-feature-card">
                    <div className="sv-feature-card-header">
                      <div className="sv-feature-icon-box" style={{ background: feat.bg, color: feat.accent }}>
                        {feat.icon}
                      </div>
                      <span className="sv-feature-tag" style={{ background: feat.bg, color: feat.accent }}>
                        {feat.tag}
                      </span>
                    </div>
                    <h3 className="sv-feature-title">{feat.title}</h3>
                    <p className="sv-feature-desc">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* On Mobile Guide tab: Always display the 4 pillars in full */
        <div className="sv-platform-features-deck">
          <div className="sv-features-section-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="sv-features-badge">WHY CHOOSE VERIFIED STALLS</span>
              <span style={{ fontSize: '11px', color: '#7A7268', fontWeight: 600 }}>Safe, Clean &amp; Official</span>
            </div>
          </div>
          <div className="sv-features-grid">
            {PLATFORM_FEATURES.map((feat, idx) => (
              <div key={idx} className="sv-feature-card">
                <div className="sv-feature-card-header">
                  <div className="sv-feature-icon-box" style={{ background: feat.bg, color: feat.accent }}>
                    {feat.icon}
                  </div>
                  <span className="sv-feature-tag" style={{ background: feat.bg, color: feat.accent }}>
                    {feat.tag}
                  </span>
                </div>
                <h3 className="sv-feature-title">{feat.title}</h3>
                <p className="sv-feature-desc">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

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
          <div className="sv-telemetry-badge" style={{ marginLeft: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 700, color: '#1E4A4A', background: '#EBF5F5', border: '1px solid #A8CFCF', padding: '3px 8px', borderRadius: '100px' }}>
            <span className="sv-pulse-dot" style={{ width: '6px', height: '6px' }}></span>
            <span className="d-inline d-md-none">LIVE</span>
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

              {/* Universal Sign In Button - Opens Glassmorphic Auth Modal */}
              <button
                onClick={() => setAuthMode('login')}
                className="btn btn-primary btn-sm"
                style={{ borderRadius: '50px', padding: '5px 13px', fontSize: '12px' }}
              >
                Sign In
              </button>
            </>
          )}
        </nav>
      </header>

      {/* ─── Mobile Sticky Jump Navigation ────────────────────────── */}
      <div className="sv-mobile-segmented-nav">
        <button
          type="button"
          className={`sv-segmented-btn ${mobileTab === 'overview' ? 'active' : ''}`}
          onClick={() => {
            setMobileTab('overview');
            document.getElementById('sv-mobile-overview-anchor')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          ⚡ Guide
        </button>
        <button
          type="button"
          className={`sv-segmented-btn ${mobileTab === 'map' ? 'active' : ''}`}
          onClick={() => {
            setMobileTab('map');
            document.getElementById('sv-gis-map-anchor')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          🗺️ Live Map
        </button>
        <button
          type="button"
          className={`sv-segmented-btn ${mobileTab === 'spots' ? 'active' : ''}`}
          onClick={() => {
            setMobileTab('spots');
            document.getElementById('sv-spots-directory-anchor')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          🍔 Stalls ({filteredVendors.length})
        </button>
      </div>

      {/* ─── Mobile-Only Overview & Features Deck ────────────────── */}
      <div id="sv-mobile-overview-anchor" className="sv-mobile-overview-section d-block d-lg-none">
        {renderHeroAndFeatures(true)}
      </div>

      {/* ─── Main GIS Workspace (Unified Immersive Canvas) ─ */}
      <main id="sv-gis-map-anchor" className={`sv-gis-workspace view-${mobileTab}`}>

        {/* Mobile Map Section Header */}
        <div className="sv-map-section-bar d-flex d-lg-none">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>🗺️</span>
            <strong style={{ fontSize: '13.5px', color: '#1E4A4A', letterSpacing: '-0.02em' }}>Interactive Spatial Map</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => jumpToWard('all', 23.8103, 90.4125, 13)}
              className="btn btn-sm btn-outline-dark"
              style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '50px', fontWeight: 600 }}
              title="Recenter to full Dhaka view"
            >
              🎯 Recenter
            </button>
            <button
              type="button"
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="btn btn-sm btn-outline-dark"
              style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '50px', fontWeight: 600 }}
            >
              {isMapExpanded ? '✕ Minimize' : '⛶ Fullscreen'}
            </button>
            <span className="badge bg-primary" style={{ fontSize: '10px' }}>{filteredVendors.length} Spots</span>
          </div>
        </div>

        {/* Full-canvas map */}
        <section className={`sv-gis-canvas ${isMapExpanded ? 'is-mobile-fullscreen' : ''}`}>

          {/* Floating Exit Fullscreen Button */}
          {isMapExpanded && (
            <button
              type="button"
              onClick={() => setIsMapExpanded(false)}
              className="sv-map-exit-fullscreen-btn d-flex d-lg-none"
            >
              ✕ Exit Fullscreen Map
            </button>
          )}

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
          <div
            ref={toolbarRef}
            className={`sv-gis-toolbar ${isDraggingToolbar ? 'is-dragging' : ''}`}
            onTouchStart={(e) => e.stopPropagation()}
            onMouseDown={handleToolbarMouseDown}
            onMouseMove={handleToolbarMouseMove}
            onMouseUp={handleToolbarMouseUp}
            onMouseLeave={handleToolbarMouseUp}
          >
            <span className="sv-gis-tool-label">METRO WARDS</span>
            {WARDS.map(w => (
              <button
                key={w.key}
                type="button"
                onClick={() => jumpToWard(w.key, w.lat, w.lng, w.zoom || 16)}
                className={`sv-gis-tool-btn ${activeWard === w.key ? 'active' : ''}`}
              >
                {w.icon && <span style={{ fontSize: '11.5px', marginRight: '3px' }}>{w.icon}</span>}
                <span>{w.label}</span>
              </button>
            ))}
            {/* End spacer so last item is never clipped by rounded capsule curve */}
            <div style={{ flexShrink: 0, width: '14px', height: '1px' }}></div>
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

              {/* Dynamic Customer Rating & 1-Tap Rate Button */}
              {(() => {
                const sId = selectedVendor.vendor_id || selectedVendor.id;
                const r = selectedVendor.ratings || { good: 15, reasonable: 2, worst: 0 };
                const goodScore = r.good || 0;
                const totalRatings = r.total || ((r.good || 0) + (r.bad || 0) + (r.reasonable || 0) + (r.worst || 0)) || 25;
                const score = totalRatings > 0 ? (4.0 + (goodScore / totalRatings) * 1.0).toFixed(1) : '4.9';
                const userRating = userRatings[sId];

                return (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ color: '#EAB308', fontSize: '13px' }}>★ ★ ★ ★ ★</span>
                      <strong style={{ fontSize: '13px', color: '#1E4A4A' }}>{score}</strong>
                      <span style={{ fontSize: '11px', color: '#7A7268' }}>({totalRatings} reviews)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRatingModalVendor(selectedVendor)}
                      style={{
                        fontSize: '11px',
                        padding: '3px 10px',
                        borderRadius: '50px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: `1.5px solid ${userRating ? '#F59E0B' : '#A8CFCF'}`,
                        background: userRating ? '#FEF3C7' : '#EBF5F5',
                        color: userRating ? '#92400E' : '#1E4A4A',
                        transition: 'all 0.15s ease'
                      }}
                      title="Rate this stall"
                    >
                      <span>⭐</span>
                      <span>{userRating ? `Your Rating: ${userRating.stars}★` : 'Rate This Stall'}</span>
                    </button>
                  </div>
                );
              })()}

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                padding: '10px 12px', background: '#F0EBE5', borderRadius: '12px',
                fontSize: '11.5px', marginBottom: '12px'
              }}>
                <div>
                  <span style={{ color: '#4A6E6E', display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Food Category</span>
                  <strong style={{ fontSize: '12px', color: '#1E4A4A' }}>
                    {selectedVendor.category || 'Street Food & Snacks'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#4A6E6E', display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Operating Hours</span>
                  <strong style={{ fontSize: '11px', color: '#322D29' }}>
                    {selectedVendor.profiles?.operating_hours || '07:00 AM – 10:30 PM'}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleToggleFavorite(selectedVendor.vendor_id || selectedVendor.id)}
                  className={`btn btn-sm ${favorites.includes(selectedVendor.vendor_id || selectedVendor.id) ? 'btn-danger' : 'btn-outline-danger'}`}
                  style={{ flex: 1, fontSize: '11.5px', borderRadius: '50px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <span>{favorites.includes(selectedVendor.vendor_id || selectedVendor.id) ? '★ Saved' : '☆ Save to Favorites'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const spotNum = selectedVendor.spots?.spot_number || 'SPOT';
                    const name = selectedVendor.profiles?.business_name || selectedVendor.profiles?.full_name || selectedVendor.vendor_name;
                    const url = `${window.location.origin}/home?spot=${spotNum}`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(`${name} (#${spotNum}) on StreetVendor BD: ${url}`);
                      alert('✓ Spot link copied to clipboard!');
                    }
                  }}
                  className="btn btn-outline-dark btn-sm"
                  style={{ fontSize: '11.5px', borderRadius: '50px', padding: '5px 12px' }}
                  title="Share this spot"
                >
                  🔗 Share
                </button>
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
            hideZoomControl={true}
            onPick={isReporting ? handlePointPick : null}
            selectedPolygon={reportDraft ? [reportDraft] : []}
            height="100%"
            center={mapCenter}
            zoom={mapZoom}
            key={`map-${mapZoom}-${mapCenter[0]}`}
          />

          {/* Map Legend */}
          <div className="sv-gis-legend">
            <button
              type="button"
              onClick={() => jumpToWard('all', 23.8103, 90.4125, 13)}
              className="sv-map-recenter-btn d-none d-lg-inline-flex"
              title="Reset view to full Dhaka metropolitan map"
            >
              <span>🎯</span>
              <span>Recenter</span>
            </button>
            <div className="sv-legend-items-group">
              {[
                { color: '#16A34A', label: 'Approved & Trusted' },
                { color: '#D97706', label: 'Demarcation' },
                { color: '#DC2626', label: 'Citizen Report' },
              ].map(l => (
                <div key={l.color} className="sv-legend-item">
                  <span className="sv-dot-indicator" style={{ backgroundColor: l.color }}></span>
                  <span>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Floating Apple-Grade Discovery Deck ───── */}
        <aside id="sv-spots-directory-anchor" className={`sv-discovery-pane ${isDeckMinimized ? 'is-minimized' : ''}`}>
          <div className="sv-pane-content">

            {/* Desktop-Only Hero and Feature Showcase */}
            <div className="d-none d-lg-block">
              {renderHeroAndFeatures(false)}
            </div>

            {/* Mobile Spot Directory Header */}
            <div className="d-block d-lg-none" style={{ marginBottom: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="sv-features-badge" style={{ fontSize: '10px' }}>POPULAR FOOD &amp; STALLS</span>
                <span style={{ fontSize: '11.5px', color: '#7A7268', fontWeight: 600 }}>Filter by category</span>
              </div>
            </div>

            {/* Category Filters */}
            <div className="sv-filter-row" style={{ flexShrink: 0, padding: '4px 0', minHeight: '38px' }}>
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
                placeholder="Search for puchka, biryani, tea, or neighborhood…"
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
                Street Food &amp; Stalls <span style={{ fontWeight: 400, color: '#7A7268', fontSize: '12px' }}>({filteredVendors.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsReporting(!isReporting)}
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: isReporting ? '#FAF1F2' : '#FFFFFF',
                  border: `1.5px solid ${isReporting ? '#D4A5A8' : '#A8CFCF'}`,
                  color: isReporting ? '#72383D' : '#1E4A4A',
                  borderRadius: '50px',
                  padding: '5px 13px',
                  minHeight: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 1px 3px rgba(30, 74, 74, 0.06)',
                  transition: 'all 0.18s ease'
                }}
              >
                <span>{isReporting ? '✕' : '＋'}</span>
                <span>{isReporting ? 'Cancel' : 'Add / Report Stall'}</span>
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
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#4A6E6E', fontSize: '13px', background: 'rgba(255,255,255,0.7)', borderRadius: '16px', border: '1.5px dashed var(--sv-border)' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                    {filter === 'favorites' ? '⭐' : '🔍'}
                  </div>
                  {filter === 'favorites' ? (
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#1E4A4A', marginBottom: '4px' }}>
                        No Saved Vendors Yet
                      </div>
                      <p style={{ fontSize: '12px', color: '#7A7268', maxWidth: '300px', margin: '0 auto 12px', lineHeight: 1.5 }}>
                        Tap the <strong>Save</strong> button (☆) on any street stall card or map marker to bookmark your favorite vendors for quick access!
                      </p>
                      <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className="btn btn-sm btn-primary"
                        style={{ borderRadius: '50px', fontSize: '11.5px', padding: '6px 16px' }}
                      >
                        Explore All Spots
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 700, color: '#1E4A4A', marginBottom: '4px' }}>No spots matching your query</div>
                      <p style={{ fontSize: '12px', color: '#7A7268', margin: '0 0 10px' }}>Try searching by another food type or ward name.</p>
                      <button
                        type="button"
                        onClick={() => { setSearch(''); setFilter('all'); }}
                        className="btn btn-sm btn-outline-dark"
                        style={{ borderRadius: '50px', fontSize: '11px', padding: '4px 12px' }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                filteredVendors.map(v => (
                  <VendorPublicCard
                    key={v.vendor_id || v.id}
                    vendor={v}
                    isSelected={selectedVendor && ((selectedVendor.id && selectedVendor.id === v.id) || (selectedVendor.vendor_id && selectedVendor.vendor_id === (v.vendor_id || v.id)))}
                    isFavorite={favorites.includes(v.vendor_id || v.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onRate={vendor => setRatingModalVendor(vendor)}
                    userRating={userRatings[v.vendor_id || v.id]}
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

      {/* Community Rating Modal for Non-Registered Guests & Foodies */}
      {ratingModalVendor && (
        <RatingModal
          vendor={ratingModalVendor}
          existingRating={userRatings[ratingModalVendor.vendor_id || ratingModalVendor.id]}
          onClose={() => setRatingModalVendor(null)}
          onSubmitRating={handleSubmitRating}
        />
      )}
    </div>
  );
}
