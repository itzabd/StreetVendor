import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/auth/AuthModal';

export default function LandingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const heroRef = useRef(null);
  const [authMode, setAuthMode] = useState(null); // 'login', 'register', or null

  // Spotlight Mouse Tracking
  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    heroRef.current.style.setProperty('--mouse-x', `${x}px`);
    heroRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  // Handle deep links/redirects (?mode=login)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    if (mode === 'login' || mode === 'register') {
      setAuthMode(mode);
      // Clean query params without full page reload
      window.history.replaceState({}, '', '/home');
    }
  }, [location]);

  const handleDashboardRedirect = () => {
    if (profile?.role === 'admin') navigate('/admin');
    else navigate('/vendor');
  };

  return (
    <div className="sv-landing sv-spotlight-container" ref={heroRef} onMouseMove={handleMouseMove}>
      <div className="sv-spotlight-overlay"></div>
      
      {/* Animated Background Blobs */}
      <div className="sv-bg-blobs">
        <div className="sv-bg-blob blob-1"></div>
        <div className="sv-bg-blob blob-2"></div>
        <div className="sv-bg-blob blob-3"></div>
      </div>

      {/* Navbar */}
      <nav className="sv-landing-nav">
        <div className="d-flex align-items-center gap-3">
          <div style={{ width: 40, height: 40, background: '#f59e0b', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛒</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, lineHeight: 1.2 }}>StreetVendor BD</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>Digital Identity System</div>
          </div>
        </div>
        <div className="d-flex gap-3">
          {user ? (
            <button onClick={handleDashboardRedirect} className="btn btn-warning btn-sm px-4 fw-semibold">Go to Dashboard</button>
          ) : (
            <>
              <button onClick={() => setAuthMode('login')} className="btn btn-outline-light btn-sm px-4">Sign In</button>
              <button onClick={() => setAuthMode('register')} className="btn btn-warning btn-sm px-4 fw-semibold">Register as Vendor</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="sv-landing-hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6 animate-entrance delay-1">
              <span className="badge bg-warning text-dark mb-3 px-3 py-2" style={{ fontSize: 12 }}>Bangladesh Street Vendor Platform</span>
              <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em' }}>
                Digital Identity &amp; Spot Management
              </h1>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 32, maxWidth: 500 }}>
                A modern platform for Bangladesh street vendors to register digitally, apply for zones, manage their assigned spots, and track permissions — all in one place.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                {user ? (
                  <button onClick={handleDashboardRedirect} className="btn btn-warning btn-lg fw-semibold px-5">
                    Back to Dashboard
                  </button>
                ) : (
                  <>
                    <button onClick={() => setAuthMode('register')} className="btn btn-warning btn-lg fw-semibold px-5">
                      Register as Vendor
                    </button>
                    <button onClick={() => setAuthMode('login')} className="btn btn-outline-light btn-lg px-5">
                      Admin Sign In
                    </button>
                  </>
                )}
              </div>

              {/* Stats Row */}
              <div className="d-flex gap-4 mt-5 flex-wrap animate-entrance delay-2">
                {[
                  { n: 'Vendor Identity', d: 'Digital records for street vendors' },
                  { n: 'Zone Mapping', d: 'Geographic zone management' },
                  { n: 'Spot Assignment', d: 'Transparent spot allocation' },
                ].map((s, i) => (
                  <div key={i} style={{ borderLeft: '2px solid rgba(255,255,255,0.3)', paddingLeft: 14 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{s.n}</div>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{s.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Cards */}
            <div className="col-lg-6 animate-entrance delay-3">
              <div className="row g-4">
                {[
                  { icon: '🪪', title: 'Digital Vendor ID', desc: 'Secure verified identity for all registered street vendors.' },
                  { icon: '🗺️', title: 'Smart Zone Mapping', desc: 'Interactive geographic boundaries for organized trading.' },
                  { icon: '📋', title: 'Digital Approvals', desc: 'Seamless online workflow for spot application and review.' },
                  { icon: '📊', title: 'Smart Rent Tracker', desc: 'Automated billing and real-time payment status monitoring.' },
                ].map((f, i) => (
                  <div key={i} className="col-sm-6">
                    <div className="sv-feature-card">
                      <div className="sv-feature-icon">{f.icon}</div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{f.title}</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="sv-landing-footer">
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500 }}>
          © 2026 StreetVendor BD — Academic Software Engineering Project
        </div>
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 8 }}>
          Bridging the gap between street vendors and digital governance.
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
