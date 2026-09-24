import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';

export default function BottomNav() {
  const { profile } = useAuth();
  const { toggleMobileNav, isMobileNavOpen } = useNav();
  const isAdmin = profile?.role === 'admin';

  const adminTabs = [
    { to: '/admin', icon: '📊', label: 'Overview', end: true },
    { to: '/admin/zones', icon: '🗺️', label: 'Zones' },
    { to: '/admin/spots', icon: '📍', label: 'Spots' },
    { to: '/admin/applications', icon: '📋', label: 'Permits' },
  ];

  const vendorTabs = [
    { to: '/vendor', icon: '📍', label: 'My Spot', end: true },
    { to: '/vendor/applications', icon: '📋', label: 'Permits' },
    { to: '/vendor/assignments', icon: '🎯', label: 'Spatial' },
    { to: '/vendor/permissions', icon: '🛡️', label: 'License' },
  ];

  const tabs = isAdmin ? adminTabs : vendorTabs;

  return (
    <nav className="sv-mobile-bottom-nav" aria-label="Mobile Navigation Bar">
      <div className="sv-bottom-nav-inner">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => `sv-bottom-tab-item${isActive ? ' active' : ''}`}
          >
            <span className="sv-bottom-tab-icon">{tab.icon}</span>
            <span className="sv-bottom-tab-label">{tab.label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          onClick={toggleMobileNav}
          className={`sv-bottom-tab-item sv-bottom-tab-btn${isMobileNavOpen ? ' active' : ''}`}
          aria-label="Toggle Full Menu"
        >
          <span className="sv-bottom-tab-icon">{isMobileNavOpen ? '✕' : '☰'}</span>
          <span className="sv-bottom-tab-label">{isMobileNavOpen ? 'Close' : 'Menu'}</span>
        </button>
      </div>
    </nav>
  );
}
