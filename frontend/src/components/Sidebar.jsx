import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { NavLink } from 'react-router-dom';

const vendorLinks = [
  { to: '/vendor', icon: '📍', label: 'Spot Overview', end: true },
  { to: '/vendor/applications', icon: '📋', label: 'Applications' },
  { to: '/vendor/assignments', icon: '🎯', label: 'My Allocation' },
  { to: '/vendor/permissions', icon: '🛡️', label: 'Verified License' },
  { to: '/vendor/rent', icon: '💳', label: 'Lease Records' },
  { to: '/vendor/complaints', icon: '💬', label: 'Grievances' },
  { to: '/vendor/profile', icon: '👤', label: 'Merchant Profile' },
];

const adminLinks = [
  { to: '/admin', icon: '📊', label: 'Oversight Desk', end: true },
  { to: '/admin/zones', icon: '🗺️', label: 'Spatial Zones' },
  { to: '/admin/spots', icon: '📍', label: 'Spot Demarcations' },
  { to: '/admin/applications', icon: '📋', label: 'Review Applications' },
  { to: '/admin/permissions', icon: '🛡️', label: 'Trade Licenses' },
  { to: '/admin/guest-reports', icon: '🚩', label: 'Citizen Reports' },
  { to: '/admin/complaints', icon: '💬', label: 'Complaints' },
  { to: '/admin/rent', icon: '💳', label: 'Rent Ledger' },
  { to: '/admin/users', icon: '👥', label: 'Directory & Users' },
];

export default function Sidebar() {
  const { profile, logout, isDemo, switchDemoRole } = useAuth();
  const { isMobileNavOpen, closeMobileNav } = useNav();
  const isAdmin = profile?.role === 'admin';

  const links = isAdmin ? adminLinks : vendorLinks;
  const section = isAdmin ? 'MUNICIPAL DESK' : 'MERCHANT PORTAL';

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div 
        className={`sv-sidebar-backdrop ${isMobileNavOpen ? 'show' : ''}`} 
        onClick={closeMobileNav}
        aria-hidden={!isMobileNavOpen}
      />

      <aside className={`sv-sidebar ${isMobileNavOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <NavLink to="/home" className="sv-sidebar-brand" onClick={closeMobileNav} style={{ borderBottom: 'none', flex: 1 }}>
            <div className="brand-icon">⚖️</div>
            <div>
              <div className="brand-title">StreetVendor BD</div>
              <div className="brand-sub">Municipal Spatial Ledger</div>
            </div>
          </NavLink>

          {/* Close button on mobile */}
          <button 
            type="button"
            className="sv-sidebar-close-btn d-lg-none"
            onClick={closeMobileNav}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="sv-nav-section">{section}</div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={closeMobileNav}
              className={({ isActive }) => `sv-nav-link${isActive ? ' active' : ''}`}
            >
              <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}

          {!isAdmin && (
            <div style={{
              margin: '16px 14px',
              padding: '12px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(129, 140, 248, 0.25)',
              borderRadius: '10px',
              fontSize: '11.5px'
            }}>
              <div style={{ color: '#FCA5A5', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <span>🚨</span> EMERGENCY CIVIC HOTLINE
              </div>
              <div style={{ color: 'rgba(199, 210, 254, 0.9)', marginBottom: '3px' }}>
                Police Dispatch: <strong style={{ fontFamily: 'var(--sv-font-mono)', color: '#FFFFFF' }}>999</strong>
              </div>
              <div style={{ color: 'rgba(199, 210, 254, 0.9)' }}>
                Govt Helpline: <strong style={{ fontFamily: 'var(--sv-font-mono)', color: '#FFFFFF' }}>16263</strong>
              </div>
            </div>
          )}
        </nav>

        <div className="sv-sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name || (isAdmin ? 'Tanvir Ahmed' : 'Rahim Uddin')}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isAdmin ? 'Licensing Officer' : 'Spot M10-04 Merchant'}
              </div>
            </div>
            {isDemo && (
              <span style={{
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                color: '#FFFFFF',
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '100px',
                letterSpacing: '0.06em',
                flexShrink: 0
              }}>
                DEMO
              </span>
            )}
          </div>

          {isDemo && (
            <button 
              onClick={() => {
                switchDemoRole(isAdmin ? 'vendor' : 'admin');
                closeMobileNav();
              }} 
              className="btn btn-sm w-100 mb-2"
              style={{ 
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(124,58,237,0.2))', 
                color: '#C7D2FE', 
                fontSize: '11px', 
                fontWeight: 600,
                border: '1px solid rgba(129, 140, 248, 0.3)',
                padding: '6px 10px'
              }}
            >
              Switch to {isAdmin ? 'Merchant View' : 'Officer Desk'}
            </button>
          )}

          <button 
            onClick={() => {
              closeMobileNav();
              logout();
            }} 
            className="btn btn-sm w-100" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.06)', 
              color: 'rgba(199, 210, 254, 0.8)', 
              border: '1px solid rgba(165, 180, 252, 0.15)', 
              fontSize: '11.5px', 
              padding: '6px 10px'
            }}
          >
            {isDemo ? 'Exit Demo Session' : 'Sign Out'}
          </button>
        </div>
      </aside>
    </>
  );
}
