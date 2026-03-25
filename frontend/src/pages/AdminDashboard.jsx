import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AdminDashboard() {
  const { addToast } = useToast();
  const [stats, setStats] = useState({ zones: 0, vendors: 0, pendingApps: 0, openComplaints: 0, spots: 0, activeAssignments: 0 });
  const [recentApps, setRecentApps] = useState([]);
  const [notifForm, setNotifForm] = useState({ title: '', message: '' });
  const [notifLoading, setNotifLoading] = useState(false);
  const { getToken } = useAuth();

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    const token = await getToken();
    const h = { Authorization: `Bearer ${token}` };
    const base = import.meta.env.VITE_API_URL;
    const [zones, apps, complaints, spots, reports] = await Promise.all([
      axios.get(`${base}/zones`, { headers: h }).catch(() => ({ data: [] })),
      axios.get(`${base}/applications`, { headers: h }).catch(() => ({ data: [] })),
      axios.get(`${base}/complaints`, { headers: h }).catch(() => ({ data: [] })),
      axios.get(`${base}/spots`, { headers: h }).catch(() => ({ data: [] })),
      axios.get(`${base}/public/reports`, { headers: h }).catch(() => ({ data: [] })),
    ]);
    setStats({
      zones: zones.data.length,
      pendingApps: apps.data.filter(a => a.status === 'pending').length,
      pendingGuestReports: reports.data.filter(r => r.status === 'pending').length,
      openComplaints: complaints.data.filter(c => c.status === 'open').length,
      spots: spots.data.length,
      availableSpots: spots.data.filter(s => s.status === 'available').length,
      occupiedSpots: spots.data.filter(s => s.status === 'occupied').length,
    });
    setRecentApps(apps.data.filter(a => a.status === 'pending').slice(0, 5));
  }

  const statCards = [
    { icon: '🗺️', label: 'Total Zones', value: stats.zones, color: '#1a6b3c', link: '/admin/zones' },
    { icon: '📍', label: 'Total Spots', value: stats.spots, color: '#2563eb', link: '/admin/spots' },
    { icon: '📋', label: 'Pending Applications', value: stats.pendingApps, color: '#f59e0b', link: '/admin/applications' },
    { icon: '🔍', label: 'Guest Reports', value: stats.pendingGuestReports, color: '#8b5cf6', link: '/admin/guest-reports' },
    { icon: '📣', label: 'Open Complaints', value: stats.openComplaints, color: '#ef4444', link: '/admin/complaints' },
  ];

  function handleSendNotif(e) {
    e.preventDefault();
    setNotifLoading(true);
    setTimeout(() => {
      const allNotifs = JSON.parse(localStorage.getItem('sv_notifications') || '[]');
      const newNotif = {
        id: Date.now().toString(),
        title: notifForm.title,
        message: notifForm.message,
        target_vendor_id: 'all',
        created_at: new Date().toISOString(),
        read: false
      };
      localStorage.setItem('sv_notifications', JSON.stringify([newNotif, ...allNotifs]));
      setNotifForm({ title: '', message: '' });
      setNotifLoading(false);
      addToast('Notification broadcasted to all vendors successfully!', 'success');
    }, 600);
  }

  return (
    <div>
      {/* Admin Banner with Shimmer Effect */}
      <div className="animate-entrance sv-shimmer-bg" style={{ 
        position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #1e293b, #334155, #1e293b)', 
        backgroundSize: '200% 100%', borderRadius: 14, padding: '22px 28px', marginBottom: 24, 
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        animation: 'sv-shimmer-shift 8s linear infinite, svEntrance 0.8s ease-out'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Admin Control Panel 🔑</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Manage zones, blocks, spots, applications, and vendor records from here.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <Link to="/admin/zones" className="btn btn-sm" style={{ background: '#1a6b3c', color: '#fff', borderRadius: 8, fontSize: 12 }}>+ Add Zone</Link>
          <Link to="/admin/applications" className="btn btn-sm" style={{ background: '#f59e0b', color: '#000', borderRadius: 8, fontSize: 12 }}>Review Applications</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {statCards.map((s, idx) => (
          <div key={s.label} className={`col-sm-6 col-xl-3 animate-entrance delay-${idx + 1}`}>
            <Link to={s.link} style={{ textDecoration: 'none' }}>
              <div className="sv-stat-card sv-hover-lift">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-accent" style={{ background: s.color }}></div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Spot Status */}
      <div className="row g-3 mb-4 animate-entrance delay-4">
        <div className="col-md-6">
          <div className="sv-card h-100 sv-hover-lift" style={{ padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a6b3c', marginBottom: 16 }}>🟢 Available Spots</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#1a6b3c' }}>{stats.availableSpots ?? '—'}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Ready to be assigned to vendors</div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="sv-card h-100 sv-hover-lift" style={{ padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#2563eb', marginBottom: 16 }}>🔵 Occupied Spots</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#2563eb' }}>{stats.occupiedSpots ?? '—'}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Currently assigned to vendors</div>
          </div>
        </div>
      </div>

      {/* Bottom Area: Pending Apps & Broadcast Notifications */}
      <div className="row g-4">
        {/* Pending Applications */}
        <div className="col-md-7">
          <div className="sv-card h-100">
            <div className="sv-card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">⏳ Pending Applications</h5>
              <Link to="/admin/applications" style={{ fontSize: 12, color: '#1a6b3c', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
            </div>
            <table className="sv-table">
              <thead><tr><th>Vendor</th><th>Zone</th><th>Notes</th><th>Applied On</th></tr></thead>
              <tbody>
                {recentApps.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: 13 }}>No pending applications</td></tr>
                )}
                {recentApps.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.profiles?.full_name || '—'}</td>
                    <td>{a.zones?.name || '—'}</td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{a.notes || '—'}</td>
                    <td style={{ color: '#64748b', fontSize: 12 }}>{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Broadcast Notifications Panel */}
        <div className="col-md-5">
          <div className="sv-card h-100 position-relative overflow-hidden">
            {/* Decoration */}
            <div className="position-absolute top-0 end-0 p-3 fs-1 opacity-25">🔔</div>
            <div className="sv-card-header bg-transparent border-bottom-0 pb-0">
              <h5 className="mb-0 text-primary fw-bold">Broadcast Notification</h5>
              <div className="small text-muted mt-1">Send a message to all active vendors.</div>
            </div>
            <div className="card-body p-4 pt-3 position-relative" style={{ zIndex: 1 }}>
              <form onSubmit={handleSendNotif}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Subject / Title</label>
                  <input type="text" className="form-control bg-light" placeholder="e.g. Rent Due, Zone Closure" value={notifForm.title} onChange={e => setNotifForm({...notifForm, title: e.target.value})} required />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Message Body</label>
                  <textarea rows="4" className="form-control bg-light" placeholder="Type your message here..." value={notifForm.message} onChange={e => setNotifForm({...notifForm, message: e.target.value})} required></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2" disabled={notifLoading} style={{ borderRadius: 8 }}>
                  <span>{notifLoading ? 'Sending...' : 'Send Broadcast'}</span>
                  <span>🚀</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
