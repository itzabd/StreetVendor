import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/auth/AuthModal';

export default function LandingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authMode, setAuthMode] = useState(null); // 'login', 'register', or null

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
    <div className="sv-landing">
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
            <div className="col-lg-6">
              <span className="badge bg-warning text-dark mb-3 px-3 py-2" style={{ fontSize: 12 }}>Bangladesh Street Vendor Platform</span>
              <h1 style={{ fontSize: 46, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
                Digital Identity &amp; Spot Management
              </h1>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
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
              <div className="d-flex gap-4 mt-5 flex-wrap">
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
            <div className="col-lg-6">
              <div className="row g-3">
                {[
                  { icon: '🪪', title: 'Digital Vendor ID', desc: 'Vendors register with name, NID, phone, and receive a verified digital identity in the system.' },
                  { icon: '🗺️', title: 'Zone & Spot Management', desc: 'Admins create zones and blocks on the map, then assign specific spots to approved vendors.' },
                  { icon: '📋', title: 'Application Workflow', desc: 'Vendors apply for preferred zones. Admins review, approve or reject applications online.' },
                  { icon: '📊', title: 'Rent & Permission Tracking', desc: 'Automated rent record logging and permission management with expiry tracking.' },
                ].map((f, i) => (
                  <div key={i} className="col-sm-6">
                    <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: '20px 18px', height: '100%', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <div className="sv-feature-icon">{f.icon}</div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{f.title}</div>
                      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.6 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 48px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>© 2026 StreetVendor BD — Academic Software Engineering Project</span>
        <div className="d-flex gap-3">
          {user ? (
            <button onClick={handleDashboardRedirect} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>Dashboard</button>
          ) : (
            <>
              <button onClick={() => setAuthMode('login')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>Sign In</button>
              <button onClick={() => setAuthMode('register')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>Register</button>
            </>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={!!authMode}
        initialMode={authMode || 'login'}
        onClose={() => setAuthMode(null)}
        onSuccess={handleDashboardRedirect}
      />
    </div>
  );
}
