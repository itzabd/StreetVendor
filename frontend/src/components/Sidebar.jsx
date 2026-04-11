import { useAuth } from '../context/AuthContext';
import { NavLink, useLocation } from 'react-router-dom';

const vendorLinks = [
  { to: '/vendor', icon: '🏠', label: 'Dashboard', end: true },
  { to: '/vendor/applications', icon: '📝', label: 'My Applications' },
  { to: '/vendor/assignments', icon: '📌', label: 'My Spots' },
  { to: '/vendor/permissions', icon: '🔑', label: 'Permissions' },
  { to: '/vendor/complaints', icon: '📣', label: 'Complaints' },
  { to: '/vendor/rent', icon: '💰', label: 'Rent Records' },
  { to: '/vendor/profile', icon: '👤', label: 'My Profile' },
];

const adminLinks = [
  { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/zones', icon: '🗺️', label: 'Zones' },
  { to: '/admin/applications', icon: '📝', label: 'Applications' },
  { to: '/admin/permissions', icon: '🔑', label: 'Licenses' },
  { to: '/admin/guest-reports', icon: '🚨', label: 'Guest Reports' },
  { to: '/admin/complaints', icon: '📣', label: 'Complaints' },
  { to: '/admin/rent', icon: '💰', label: 'Rent Records' },
  { to: '/admin/profile', icon: '👤', label: 'My Profile' },
];

export default function Sidebar() {
  const { profile, logout } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const links = isAdmin ? adminLinks : vendorLinks;
  const section = isAdmin ? 'Admin Panel' : 'Vendor Panel';

  return (
    <div className="sv-sidebar">
      <NavLink to="/" className="sv-sidebar-brand">
        <div className="brand-icon">🛒</div>
        <div>
          <div className="brand-text">StreetVendor BD</div>
          <div className="brand-sub">Digital Identity System</div>
        </div>
      </NavLink>

      <div className="sv-nav-section">{section}</div>

      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) => `sv-nav-link${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">{link.icon}</span>
          {link.label}
        </NavLink>
      ))}

      <div className="sv-sidebar-footer">
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8 }}>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{profile?.full_name || 'User'}</div>
          <span className="badge" style={{ background: isAdmin ? '#f59e0b' : 'rgba(255,255,255,0.15)', color: isAdmin ? '#000' : '#fff', fontSize: 10, borderRadius: 8 }}>
            {isAdmin ? 'Admin' : 'Vendor'}
          </span>
        </div>
        <button onClick={logout} className="btn btn-sm w-100" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: 12 }}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}
