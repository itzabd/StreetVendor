import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';

const pageTitles = {
  '/vendor': 'Merchant Operations & Spot Overview',
  '/vendor/applications': 'Spot Allocation Applications',
  '/vendor/assignments': 'Designated Spatial Demarcation',
  '/vendor/permissions': 'Official Verified Trade Licenses',
  '/vendor/complaints': 'Grievance & Dispute Registry',
  '/vendor/rent': 'Monthly Lease Fee Records',
  '/vendor/profile': 'Merchant Identity & Business Profile',
  '/admin': 'Municipal Oversight & Spot Registry Desk',
  '/admin/zones': 'GIS Spatial Trade Zones',
  '/admin/blocks': 'Sector & Block Demarcations',
  '/admin/spots': 'Designated Vending Spot Matrix',
  '/admin/applications': 'Vendor Permit Applications Review',
  '/admin/assignments': 'Spot Allocation & Lease Assignments',
  '/admin/permissions': 'Trade License Approvals',
  '/admin/guest-reports': 'Citizen Unofficial Spot Reports',
  '/admin/complaints': 'Civic Grievances & Disputes',
  '/admin/rent': 'Municipal Rent Collection Ledger',
  '/admin/users': 'Municipal Trade Register Directory',
  '/admin/profile': 'Officer Administrative Profile',
};

export default function Navbar() {
  const { profile, logout, isDemo, switchDemoRole } = useAuth();
  const { toggleMobileNav, isMobileNavOpen } = useNav();
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || 'Municipal Spatial Ledger';
  const isAdmin = profile?.role === 'admin';
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close menus when route changes
  useEffect(() => {
    setShowProfileMenu(false);
    setShowNotifMenu(false);
  }, [location.pathname]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadNotifs = () => {
      try {
        const raw = localStorage.getItem('sv_notifications');
        const allNotifs = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(allNotifs)) return setNotifications([]);
        
        if (!profile?.id) return setNotifications([]);

        const filtered = allNotifs.filter(n => {
          const isBroadcast = n.target_vendor_id === 'all';
          const isTargetedToMe = n.target_vendor_id === profile.id;
          return isBroadcast || isTargetedToMe;
        }).reverse().slice(0, 8);

        setNotifications(filtered);
      } catch (err) {
        console.error('Notification system error:', err);
        setNotifications([]);
      }
    };

    loadNotifs();
    const interval = setInterval(loadNotifs, 4000);
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

  const unreadCount = notifications.filter(n => !(n.readBy || []).includes(profile?.id)).length;
  const initials = profile?.full_name ? profile.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : (isAdmin ? 'TA' : 'RU');

  return (
    <header className="sv-topbar">
      <div className="sv-topbar-left">
        <button 
          type="button" 
          className="sv-mobile-menu-toggle d-lg-none"
          onClick={toggleMobileNav}
          aria-label={isMobileNavOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          <span className="sv-hamburger-line"></span>
          <span className="sv-hamburger-line"></span>
          <span className="sv-hamburger-line"></span>
        </button>
        <div className="sv-topbar-title" title={title}>{title}</div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button 
            className="btn btn-outline-dark btn-sm"
            style={{ width: '34px', height: '34px', padding: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => { setShowNotifMenu(!showNotifMenu); setShowProfileMenu(false); }}
            title="Official dispatches and alerts"
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                width: '8px',
                height: '8px',
                backgroundColor: '#5DBBBB',
                borderRadius: '50%',
                boxShadow: '0 0 6px rgba(30, 74, 74, 0.4)'
              }}></span>
            )}
          </button>
          
          {showNotifMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              marginTop: '8px',
              width: 'min(320px, calc(100vw - 20px))',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--sv-border)',
              borderRadius: 'var(--sv-radius)',
              boxShadow: 'var(--sv-shadow-lg)',
              zIndex: 1000,
              padding: '8px 0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                borderBottom: '1px solid var(--sv-border)'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-primary)' }}>
                  Civic Dispatches ({notifications.length})
                </span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    style={{ background: 'none', border: 'none', color: 'var(--sv-primary)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--sv-text-muted)', fontSize: '12px' }}>
                    No unread notices
                  </div>
                ) : (
                  notifications.map(n => {
                    const isRead = (n.readBy || []).includes(profile?.id);
                    return (
                      <div 
                        key={n.id} 
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid var(--sv-border-subtle)',
                          backgroundColor: isRead ? '#FFFFFF' : 'var(--sv-primary-light)',
                          cursor: 'pointer'
                        }}
                        onClick={() => markAsRead(n.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-primary)' }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--sv-text-subtle)' }}>
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--sv-text-secondary)', lineHeight: 1.35 }}>
                          {n.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Trigger */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button 
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifMenu(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 'var(--sv-radius)'
            }}
          >
            <div className="d-none d-sm-flex" style={{ textAlign: 'right', flexDirection: 'column' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--sv-text-primary)', lineHeight: 1.2 }}>
                {profile?.full_name || (isAdmin ? 'Tanvir Ahmed' : 'Rahim Uddin')}
              </span>
              <span style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)' }}>
                {isDemo ? (isAdmin ? 'Demo Licensing Officer' : 'Demo Merchant') : (isAdmin ? 'Licensing Officer' : 'Merchant')}
              </span>
            </div>
            
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1E4A4A, #2D6060)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px',
              boxShadow: '0 2px 8px rgba(30, 74, 74, 0.25)',
              flexShrink: 0
            }}>
              {initials}
            </div>
          </button>

          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              marginTop: '8px',
              width: '200px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--sv-border)',
              borderRadius: 'var(--sv-radius)',
              boxShadow: 'var(--sv-shadow-lg)',
              zIndex: 1000,
              padding: '6px'
            }}>
              {isDemo && (
                <button 
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--sv-primary)',
                    background: 'var(--sv-primary-light)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginBottom: '4px'
                  }}
                  onClick={() => {
                    const next = isAdmin ? 'vendor' : 'admin';
                    switchDemoRole(next);
                    navigate(next === 'admin' ? '/admin' : '/vendor');
                    setShowProfileMenu(false);
                  }}
                >
                  Switch to {isAdmin ? 'Merchant View' : 'Officer Desk'}
                </button>
              )}

              <button 
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 10px',
                  fontSize: '12px',
                  color: 'var(--sv-text-secondary)',
                  background: 'none',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  navigate(isAdmin ? '/admin/profile' : '/vendor/profile');
                  setShowProfileMenu(false);
                }}
              >
                Profile Settings
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--sv-border)', margin: '4px 0' }}></div>

              <button 
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '7px 10px',
                  fontSize: '12px',
                  color: 'var(--sv-status-danger)',
                  background: 'none',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  logout();
                  setShowProfileMenu(false);
                  navigate('/home');
                }}
              >
                {isDemo ? 'Exit Demo Session' : 'Sign Out'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
