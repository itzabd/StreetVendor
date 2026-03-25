import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/vendor': 'Vendor Dashboard',
  '/vendor/applications': 'My Applications',
  '/vendor/assignments': 'My Assigned Spots',
  '/vendor/permissions': 'My Permissions',
  '/vendor/complaints': 'My Complaints',
  '/vendor/rent': 'Rent Records',
  '/vendor/profile': 'Profile Settings',
  '/admin': 'Admin Dashboard',
  '/admin/zones': 'Zone Management',
  '/admin/blocks': 'Block Management',
  '/admin/spots': 'Spot Management',
  '/admin/applications': 'Vendor Applications',
  '/admin/assignments': 'Spot Assignments',
  '/admin/permissions': 'Permission Management',
  '/admin/complaints': 'Complaints',
  '/admin/rent': 'Rent Records',
  '/admin/profile': 'Profile Settings',
};

export default function Navbar() {
  const { profile, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || 'StreetVendor BD';
  const isAdmin = profile?.role === 'admin';
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  
  // Simulated notifications stored in localStorage for Phase 3 constraint
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadNotifs = () => {
      try {
        const raw = localStorage.getItem('sv_notifications');
        const allNotifs = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(allNotifs)) throw new Error('Invalid format');
        
        if (!profile?.id) return setNotifications([]);

        const filtered = allNotifs.filter(n => {
          const isBroadcast = n.target_vendor_id === 'all';
          const isTargetedToMe = n.target_vendor_id === profile.id;
          return isBroadcast || isTargetedToMe;
        }).reverse().slice(0, 10);

        setNotifications(filtered);
      } catch (err) {
        console.error('Notification system error:', err);
        setNotifications([]);
      }
    };

    loadNotifs();
    const interval = setInterval(loadNotifs, 3000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  const markAsRead = (notifId) => {
    const userId = profile?.id;
    if (!userId) return;
    const allNotifs = JSON.parse(localStorage.getItem('sv_notifications') || '[]');
    const updated = allNotifs.map(n => {
      if (n.id === notifId) {
        return { ...n, readBy: Array.from(new Set([...(n.readBy || []), userId])) };
      }
      return n;
    });
    localStorage.setItem('sv_notifications', JSON.stringify(updated));
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, readBy: Array.from(new Set([...(n.readBy || []), userId])) } : n));
  };

  const markAllAsRead = () => {
    const userId = profile?.id;
    if (!userId) return;
    const allNotifs = JSON.parse(localStorage.getItem('sv_notifications') || '[]');
    const updated = allNotifs.map(n => {
      const isTarget = n.target_vendor_id === 'all' || n.target_vendor_id === userId;
      if (isTarget) {
        return { ...n, readBy: Array.from(new Set([...(n.readBy || []), userId])) };
      }
      return n;
    });
    localStorage.setItem('sv_notifications', JSON.stringify(updated));
    setNotifications(prev => prev.map(n => ({ ...n, readBy: Array.from(new Set([...(n.readBy || []), userId])) })));
  };

  const initials = profile?.full_name ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const unreadCount = notifications.filter(n => !(n.readBy || []).includes(profile?.id)).length;

  return (
    <div className="sv-topbar d-flex justify-content-between align-items-center position-relative">
      <div className="sv-topbar-title">{title}</div>
      
      <div className="d-flex align-items-center gap-4">
        {/* Notification Bell */}
        <div className="position-relative">
          <button 
            className="btn btn-sm btn-light border position-relative"
            style={{ width: 40, height: 40, borderRadius: '50%' }}
            onClick={() => { setShowNotifMenu(!showNotifMenu); setShowProfileMenu(false); }}
          >
            🔔
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: 9 }}>
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifMenu && (
            <div className="position-absolute end-0 mt-2 shadow bg-white rounded-3 p-2" style={{ width: 320, zIndex: 1000, border: '1px solid #e2e8f0' }}>
              <div className="d-flex justify-content-between align-items-center mb-2 px-2 pt-2 border-bottom pb-2">
                <h6 className="mb-0 fw-bold">Notifications</h6>
                <div className="d-flex align-items-center gap-2">
                  {unreadCount > 0 && (
                    <span 
                      className="text-primary pointer small" 
                      style={{ cursor: 'pointer', fontSize: 11, fontWeight: 600, textDecoration: 'underline' }}
                      onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                    >
                      Mark all as read
                    </span>
                  )}

                </div>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="text-muted text-center py-4 small">No new notifications</div>
                ) : (
                  notifications.map(n => {
                    const isRead = (n.readBy || []).includes(profile?.id);
                    const isBroadcast = n.target_vendor_id === 'all';
                    return (
                      <div key={n.id} className="p-2 border-bottom position-relative" style={{ borderRadius: 6, background: isRead ? '#fff' : '#f0fdf4' }}>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <div className="fw-semibold" style={{ fontSize: 13, color: '#1a6b3c', paddingRight: 20 }}>{n.title}</div>
                          {isBroadcast && <span className="badge bg-secondary" style={{ fontSize: 8 }}>System</span>}
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{n.message}</div>
                        <div className="d-flex justify-content-between align-items-end mt-1">
                          <div className="text-muted" style={{ fontSize: 10 }}>{new Date(n.created_at).toLocaleDateString()}</div>
                          {!isRead && (
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className="btn btn-sm text-primary p-0" 
                              style={{ fontSize: 11, background: 'transparent', border: 'none', textDecoration: 'underline' }}
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                        {!isRead && <div className="position-absolute" style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%', top: 12, right: 12 }}></div>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="position-relative">
          <div 
            className="d-flex align-items-center gap-3" 
            style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: 12, transition: 'background 0.2s' }}
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifMenu(false); }}
          >
            <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{profile?.full_name || 'User'}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{isAdmin ? '🔑 Administrator' : '🛒 Vendor'}</div>
            </div>
            
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
            ) : (
              <div className="sv-avatar">{initials}</div>
            )}
          </div>

          {showProfileMenu && (
            <div className="position-absolute end-0 mt-2 shadow bg-white rounded-3 py-2" style={{ width: 200, zIndex: 1000, border: '1px solid #e2e8f0' }}>
              <button 
                className="dropdown-item py-2 px-3 fw-semibold text-secondary" 
                onClick={() => {
                  navigate(isAdmin ? '/admin/profile' : '/vendor/profile');
                  setShowProfileMenu(false);
                }}
              >
                ⚙️ Profile Settings
              </button>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item py-2 px-3 fw-semibold text-danger" 
                onClick={() => {
                  logout();
                  setShowProfileMenu(false);
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
