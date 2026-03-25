import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/auth/AuthModal';
import ZoneMap from '../components/ZoneMap';
import VendorPublicCard from '../components/VendorPublicCard';
import axios from 'axios';

export default function LandingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const discoveryRef = useRef(null);
  const heroRef = useRef(null);

  // Discovery States
  const [authMode, setAuthMode] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const base = import.meta.env.VITE_API_URL;

  // Map States
  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]);
  const [mapZoom, setMapZoom] = useState(14);
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
    fetchVendors();
    if (user) fetchFavorites();
    else loadGuestFavorites();
  }, [user]);

  // Spotlight Mouse Tracking
  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    heroRef.current.style.setProperty('--mouse-x', `${x}px`);
    heroRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${base}/public/vendors`);
      setVendors(res.data);
    } catch (err) {
      console.error('Failed to fetch vendors', err);
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

  const handleRate = async (vendorId, type) => {
    try {
      const token = await (async () => {
        const { data: { session } } = await (await import('../supabaseClient')).default.auth.getSession();
        return session?.access_token;
      })();
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      await axios.post(`${base}/public/rate`, { vendor_id: vendorId, rating_type: type }, headers);

      setVendors(vendors.map(v => {
        const vid = v.vendor_id || v.id;
        if (vid === vendorId) {
          const newRatings = { ...v.ratings };
          newRatings[type]++;
          return { ...v, ratings: newRatings };
        }
        return v;
      }));
    } catch (err) {
      console.error('Rating failed', err);
    }
  };

  const handleSelectVendor = (vendor) => {
    // Support both registered vendors (vendor.spots) and guest reports (vendor.latitude/longitude)
    const lat = vendor.spots?.latitude ?? vendor.latitude;
    const lng = vendor.spots?.longitude ?? vendor.longitude;
    if (lat && lng) {
      setMapCenter([parseFloat(lat), parseFloat(lng)]);
      setMapZoom(18);
      discoveryRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      fetchVendors(); // Refresh map (will show unverified if admin approved previously, but here it's just a refetch)
    } catch (err) {
      console.error('Report failed', err);
    }
  };

  const [isExplorerOpen, setIsExplorerOpen] = useState(false);

  // ... (previous state/effects)

  const toggleExplorer = () => {
    setIsExplorerOpen(!isExplorerOpen);
  };

  const handleDashboardRedirect = () => {
    if (profile?.role === 'admin') navigate('/admin');
    else navigate('/vendor');
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'all') return matchesSearch;
    const r = v.ratings;
    const max = Math.max(r.good, r.reasonable, r.worst);
    if (max === 0) return false;
    if (filter === 'good') return r.good === max && matchesSearch;
    if (filter === 'reasonable') return r.reasonable === max && matchesSearch;
    if (filter === 'worst') return r.worst === max && matchesSearch;
    return matchesSearch;
  });

  const spotMarkers = vendors.map(v => ({
    ...v.spots,
    status: (v.ratings.good || 0) >= (v.ratings.worst || 0) ? 'available' : 'occupied',
    vendor_name: v.profiles?.full_name,
    ratings: v.ratings
  }));

  return (
    <div className={`sv-landing ${isExplorerOpen ? 'discovery-open' : ''}`}>

      {/* Sticky Premium Navbar */}
      <nav className="sv-landing-v2-nav d-flex justify-content-between align-items-center px-4 py-3">
        <div className="d-flex align-items-center gap-3">
          <div style={{ width: 40, height: 40, background: '#f59e0b', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛒</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>StreetVendor <span className="text-warning">BD</span></div>
            <div style={{ fontSize: 10, opacity: 0.6, color: '#fff', textTransform: 'uppercase' }}>Digital Identity System</div>
          </div>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <button onClick={toggleExplorer} className="btn btn-link text-white text-decoration-none small fw-semibold d-none d-md-block">
            {isExplorerOpen ? 'Back to Home' : 'Explore Map'}
          </button>
          {user ? (
            <button onClick={handleDashboardRedirect} className="btn btn-warning btn-sm px-4 fw-bold shadow-sm">Dashboard</button>
          ) : (
            <>
              <button onClick={() => setAuthMode('login')} className="btn btn-link text-white text-decoration-none small fw-semibold">Sign In</button>
              <button onClick={() => setAuthMode('register')} className="btn btn-warning btn-sm px-4 fw-bold">Register</button>
            </>
          )}
        </div>
      </nav>

      {/* 1. Hero Section (Branding) */}
      <section className="sv-landing-hero-section sv-spotlight-container" ref={heroRef} onMouseMove={handleMouseMove}>
        <div className="sv-spotlight-overlay"></div>
        <div className="sv-bg-blobs">
          <div className="sv-bg-blob blob-1"></div>
          <div className="sv-bg-blob blob-2"></div>
        </div>

        <div className="container h-100 d-flex align-items-center">
          <div className="row align-items-center w-100 g-5 justify-content-between">
            <div className="col-lg-5">
              <div className="animate-entrance pt-lg-5 pt-4" style={{ animationDelay: '0.1s' }}>
                <span className="badge bg-warning text-dark mb-4 px-3 py-2 shadow-sm" style={{ fontSize: 13, borderRadius: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bangladesh Street Vendor Platform</span>
              </div>
              <h1 className="animate-entrance m-0" style={{ fontSize: 60, fontWeight: 900, color: '#fff', lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.04em', animationDelay: '0.2s' }}>
                Modernizing <br /><span className="text-warning">Street Trade</span>
              </h1>
              <p className="animate-entrance" style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 40, maxWidth: 520, fontWeight: 400, animationDelay: '0.3s' }}>
                Empowering vendors with digital identity, smart location tracking, and community-driven verification. Join the city's most transparent trade ecosystem.
              </p>
              <div className="d-flex gap-4 flex-wrap animate-entrance" style={{ animationDelay: '0.4s' }}>
                <button onClick={toggleExplorer} className="btn btn-warning btn-lg fw-800 px-5 py-3 shadow-lg rounded-pill sv-btn-glow" style={{ fontSize: 18 }}>
                  Explore city Map
                </button>
                <button onClick={() => setAuthMode('register')} className="btn btn-outline-light btn-lg px-5 py-3 rounded-pill" style={{ fontSize: 18 }}>
                  Register Today
                </button>
              </div>

              {/* Mission Stats */}
              <div className="d-flex gap-5 mt-5 flex-wrap pb-5 mb-5">
                {[
                  { n: 'Verified Identity', d: 'Secure biometric records', icon: '🆔' },
                  { n: 'Smart Mapping', d: 'Digital zone management', icon: '🎯' },
                  { n: 'Public Trust', d: 'Reputation tracking', icon: '🌟' },
                ].map((s, i) => (
                  <div key={i} className="animate-entrance d-flex align-items-center gap-3" style={{ animationDelay: `${0.6 + i*0.1}s` }}>
                    <div style={{ fontSize: 24, opacity: 0.8 }}>{s.icon}</div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 2 }}>{s.n}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="col-lg-5">
              <div className="row g-4 d-flex justify-content-center">
                {[
                  { icon: '🪪', title: 'Digital ID', desc: 'Secure verified identity for all registered street vendors.', delay: '0.3s' },
                  { icon: '📍', title: 'Location Tracking', desc: 'Live map of verified trade spots across the city.', delay: '0.45s' },
                  { icon: '📋', title: 'Spot Approval', desc: 'Verified process for application and trade zoning.', delay: '0.6s' },
                  { icon: '📊', title: 'Trade Data', desc: 'Insightful analytics for smarter city management.', delay: '0.75s' },
                ].map((f, i) => (
                  <div key={i} className="col-sm-6 animate-entrance" style={{ animationDelay: f.delay }}>
                    <div className="sv-feature-card">
                      <div className="sv-feature-icon">{f.icon}</div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 17, marginBottom: 10 }}>{f.title}</div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 2. Bottom Sheet Discovery Portal */}
      <section className={`sv-discovery-sheet ${isExplorerOpen ? 'is-open' : ''}`}>

        {/* Pull Handle */}
        <div className="sv-sheet-handle" onClick={toggleExplorer}>
          <div className="sv-handle-bar"></div>
          <div className="text-white fw-bold small animate-pulse">
            {isExplorerOpen ? 'Pull down to close' : 'Explore City Map'}
          </div>
          {!isExplorerOpen && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              Slide up to discover verified vendors and trade spots
            </div>
          )}
        </div>

        <div className="sv-discovery-content">
          {/* Left Sidebar: Vendor Discovery */}
          <div className="discovery-pane p-4" style={{ width: 420, overflowY: 'auto', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(30px)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="mb-4 d-flex justify-content-between align-items-start">
              <div>
                <h4 className="fw-900 mb-1" style={{ color: '#ffffff', letterSpacing: '-0.02em' }}>Discovery Portal</h4>
                <p className="small mb-0" style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Find verified vendors and trade spots</p>
              </div>
              <button
                onClick={toggleExplorer}
                className="btn btn-sm btn-outline-light border-0 opacity-50 hover-opacity-100"
                style={{ padding: '4px 8px', borderRadius: 8 }}
              >
                ✕
              </button>
            </div>

            <div className="d-flex gap-2 mb-4">
              <div className="position-relative flex-grow-1">
                <span className="position-absolute top-50 start-0 translate-middle-y ps-3" style={{ opacity: 0.6 }}>🔍</span>
                <input
                  type="text"
                  className="form-control bg-dark border-secondary bg-opacity-50 text-white ps-5 py-2 rounded-3"
                  placeholder="Search vendors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ fontSize: 13, border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>

            <div className="d-flex gap-2 mb-4 scrollbar-hide" style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 5, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {[
                { key: 'all',        label: 'All Spots' },
                { key: 'good',       label: '👍 Good' },
                { key: 'reasonable', label: '⚖️ Reasonable' },
                { key: 'worst',      label: '👎 Bad' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`btn btn-sm px-3 rounded-pill ${filter === key ? 'btn-warning fw-bold text-dark' : 'btn-outline-light opacity-50'}`}
                  style={{ fontSize: 12, border: filter === key ? 'none' : '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {isReporting ? (
              <div className="report-flow animate-entrance bg-warning bg-opacity-10 p-4 rounded-4 border border-warning border-opacity-30 mb-4 shadow-lg">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 fw-bold text-warning">📍 Reporting New Spot</h6>
                  <button onClick={() => setIsReporting(false)} className="btn-close btn-close-white small"></button>
                </div>

                {reportSuccess ? (
                  <div className="alert alert-success py-2 small mb-0">Report submitted! Waiting for verification.</div>
                ) : (
                  <>
                    {!reportDraft ? (
                      <p className="small text-white opacity-75 mb-3">Click on the map to pick the exact spot location.</p>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        <div className="badge bg-dark border border-warning border-opacity-25 text-warning p-3 text-start shadow-sm" style={{ borderRadius: 12 }}>
                          <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: '0.05em' }}>PICKED LOCATION</div>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>{reportDraft[0].toFixed(5)}, {reportDraft[1].toFixed(5)}</div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label small text-warning opacity-75 mb-1 fw-bold" style={{ fontSize: 10, letterSpacing: '0.05em' }}>VENDOR NAME</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-dark border-secondary text-white py-2"
                            placeholder="e.g. Mofiz's Tea Stall"
                            value={reportData.vendor_name}
                            onChange={(e) => setReportData({ ...reportData, vendor_name: e.target.value })}
                            style={{ borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label small text-warning opacity-75 mb-1 fw-bold" style={{ fontSize: 10, letterSpacing: '0.05em' }}>CATEGORY</label>
                          <select
                            className="form-select form-select-sm bg-dark border-secondary text-white py-2"
                            value={reportData.category}
                            onChange={(e) => setReportData({ ...reportData, category: e.target.value })}
                            style={{ borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                          >
                            <option value="">Select Category</option>
                            <option value="Tea/Coffee">Tea/Coffee</option>
                            <option value="Snacks/Street Food">Snacks/Street Food</option>
                            <option value="Fruit/Juice">Fruit/Juice</option>
                            <option value="Vegetables">Vegetables</option>
                            <option value="Clothing/Goods">Clothing/Goods</option>
                          </select>
                        </div>
                        <div className="mb-4">
                          <label className="form-label small text-warning opacity-75 mb-1 fw-bold" style={{ fontSize: 10, letterSpacing: '0.05em' }}>REPORTER NAME (OPTIONAL)</label>
                          <input
                            type="text"
                            className="form-control form-control-sm bg-dark border-secondary text-white py-2"
                            placeholder="Your name or alias"
                            value={reportData.reported_by_name}
                            onChange={(e) => setReportData({ ...reportData, reported_by_name: e.target.value })}
                            style={{ borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                        </div>
                        <button
                          onClick={handleSubmitReport}
                          disabled={!reportData.vendor_name}
                          className="btn btn-warning btn-sm w-100 fw-bold py-2 shadow-sm"
                          style={{ borderRadius: 10, letterSpacing: '0.05em' }}
                        >
                          SUBMIT REPORT
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsReporting(true)}
                className="btn btn-outline-warning btn-sm w-100 mb-4 fw-bold py-2 rounded-3 border-2"
                style={{ borderStyle: 'dashed' }}
              >
                + Pin Your Report
              </button>
            )}

            <div className="vendor-list">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-warning mb-3"></div>
                  <div className="text-white small">Refreshing city map...</div>
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted small">No vendors found matching your search</div>
                </div>
              ) : (
                filteredVendors.map((v) => (
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

            {/* In-sidebar Footer */}
            <div className="mt-5 pt-4 text-center border-top border-white border-opacity-10 opacity-30">
              <p style={{ color: '#fff', fontSize: 10, letterSpacing: '0.05em', marginBottom: 0 }}>
                © {new Date().getFullYear()} STREETVENDOR BD
              </p>
              <p style={{ color: '#fff', fontSize: 9, opacity: 0.6 }}>Digital Infrastructure for Cities</p>
            </div>
          </div>

          {/* Right Side: Map */}
          <div className="flex-grow-1 position-relative">
            <ZoneMap
              spotMarkers={spotMarkers}
              viewOnly={!isReporting}
              onPick={isReporting ? handlePointPick : null}
              selectedPolygon={reportDraft ? [reportDraft] : []}
              height="100%"
              center={mapCenter}
              zoom={mapZoom}
              key={`map-${mapZoom}`}
            />

            <div className="position-absolute" style={{ top: 20, left: 20, zIndex: 1000, pointerEvents: 'none' }}>
              <div className="p-3 rounded-4 shadow-lg text-white" style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: 200 }}>
                <div className="fw-bold small mb-1">🗺️ Live Map Guide</div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>Marker colors indicate crowdsourced reputation:</div>
                <div className="mt-2 d-flex flex-column gap-1">
                  <div className="d-flex align-items-center gap-2"><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }}></span> <span style={{ fontSize: 9 }}>Mostly Positive Feedback</span></div>
                  <div className="d-flex align-items-center gap-2"><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }}></span> <span style={{ fontSize: 9 }}>Needs Improvement</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={!!authMode}
        initialMode={authMode || 'login'}
        onClose={() => setAuthMode(null)}
        onSuccess={handleDashboardRedirect}
      />

      <style>{`
        .sv-landing { scroll-behavior: smooth; overflow-x: hidden; }
        .discovery-pane::-webkit-scrollbar { width: 5px; }
        .discovery-pane::-webkit-scrollbar-track { background: transparent; }
        .discovery-pane::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        
        .scrollbar-hide::-webkit-scrollbar { display: none !important; }
        .scrollbar-hide { 
          -ms-overflow-style: none !important; 
          scrollbar-width: none !important; 
        }

        .animate-entrance { animation: svEntrance 1s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes svEntrance {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-pulse { animation: svPulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes svPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        .sv-btn-glow { position: relative; }
        .sv-btn-glow:hover { box-shadow: 0 0 30px rgba(245, 158, 11, 0.4); transform: scale(1.05); }
        
        @keyframes svLineDrive {
          0% { height: 0; opacity: 0; }
          50% { height: 40px; opacity: 1; }
          100% { height: 0; opacity: 0; transform: translateY(40px); }
        }
      `}</style>
    </div>
  );
}
