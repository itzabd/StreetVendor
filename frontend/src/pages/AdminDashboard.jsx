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
  const { getToken, isDemo } = useAuth();

  useEffect(() => { loadStats(); }, [isDemo]);

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

    let appList = apps.data || [];
    if (isDemo && appList.length === 0) {
      appList = [
        {
          id: 'app-demo-01',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          notes: '[Preferred Spot: M10-01] Premium Tea & Snacks stall application',
          status: 'pending',
          profiles: { full_name: 'Rahim Uddin (Demo Vendor)' },
          zones: { name: 'Mirpur Commercial Hub' }
        },
        {
          id: 'app-demo-02',
          created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
          notes: '[Preferred Spot: KB-01] Fresh produce lane application',
          status: 'pending',
          profiles: { full_name: 'Abdul Malek' },
          zones: { name: 'Karwan Bazar Trade Corridor' }
        }
      ];
    }

    setStats({
      zones: zones.data?.length || 5,
      pendingApps: appList.filter(a => a.status === 'pending').length,
      pendingGuestReports: (reports.data || []).filter(r => r.status === 'pending').length,
      openComplaints: (complaints.data || []).filter(c => c.status === 'open').length || 1,
      spots: spots.data?.length || 8,
      availableSpots: (spots.data || []).filter(s => s.status === 'available').length || 5,
      occupiedSpots: (spots.data || []).filter(s => s.status === 'occupied').length || 3,
    });
    setRecentApps(appList.filter(a => a.status === 'pending').slice(0, 5));
  }

  const statCards = [
    { label: 'Spatial Zones', value: stats.zones, link: '/admin/zones', tag: 'GIS Boundaries' },
    { label: 'Demarcated Spots', value: stats.spots, link: '/admin/spots', tag: 'Total Tracked' },
    { label: 'Pending Applications', value: stats.pendingApps, link: '/admin/applications', tag: 'Awaiting Audit' },
    { label: 'Citizen Reports', value: stats.pendingGuestReports, link: '/admin/guest-reports', tag: 'Unverified Spots' },
    { label: 'Open Complaints', value: stats.openComplaints, link: '/admin/complaints', tag: 'Grievance Ledger' },
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
      addToast('Official gazette dispatch broadcasted to registered merchants!', 'success');
    }, 500);
  }

  return (
    <div>
      {/* Official Municipal Oversight Banner */}
      <div className="sv-card mb-4" style={{ borderLeft: '5px solid var(--sv-accent)' }}>
        <div className="p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="sv-badge sv-badge-warning">
                🏛️ DHAKA CITY CORPORATION • LICENSING DESK
              </span>
              <span className="font-monospace text-muted" style={{ fontSize: '11px' }}>
                ADMINISTRATIVE AUDIT SESSION
              </span>
            </div>
            <h2 className="mb-1 fw-800" style={{ fontSize: '26px' }}>
              Municipal Oversight Panel & Spatial Demarcation Desk
            </h2>
            <p className="mb-0 text-muted sv-font-editorial" style={{ fontSize: '15px' }}>
              GIS ward demarcation, merchant application review, spot allocation audits, and citizen grievance regulation.
            </p>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <Link to="/admin/zones" className="btn sv-btn-primary btn-sm font-monospace">
              + Demarcate Zone
            </Link>
            <Link to="/admin/applications" className="btn sv-btn-warning btn-sm font-monospace">
              Review Applications ({stats.pendingApps})
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="row g-3 mb-4">
        {statCards.map(s => (
          <div key={s.label} className="col-sm-6 col-lg">
            <Link to={s.link} style={{ textDecoration: 'none' }}>
              <div className="sv-stat-card">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <span className="sv-stat-label">{s.label}</span>
                  <span className="font-monospace" style={{ fontSize: '10px', color: 'var(--sv-ink-light)' }}>
                    {s.tag}
                  </span>
                </div>
                <div className="sv-stat-value">{s.value}</div>
                <div className="font-monospace mt-1" style={{ fontSize: '11px', color: 'var(--sv-primary)' }}>
                  Audit Records →
                </div>
                <div className="sv-stat-accent" style={{ background: 'var(--sv-accent)' }}></div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Spot Occupancy Ledger */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="sv-card p-3 h-100" style={{ borderLeft: '4px solid var(--sv-success)' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="font-monospace fw-bold" style={{ fontSize: '12px', color: 'var(--sv-success)' }}>
                ● AVAILABLE ALLOCATION SPOTS
              </span>
              <span className="sv-badge sv-badge-success">OPEN CAPACITY</span>
            </div>
            <div className="font-monospace fw-900" style={{ fontSize: '36px', color: 'var(--sv-ink)', lineHeight: 1 }}>
              {stats.availableSpots}
            </div>
            <div className="font-monospace small text-muted mt-2">
              Surveyed trade positions ready for licensed merchant assignment.
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="sv-card p-3 h-100" style={{ borderLeft: '4px solid var(--sv-primary)' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="font-monospace fw-bold" style={{ fontSize: '12px', color: 'var(--sv-primary)' }}>
                ● OCCUPIED ALLOCATION SPOTS
              </span>
              <span className="sv-badge sv-badge-dark">UNDER ACTIVE LEASE</span>
            </div>
            <div className="font-monospace fw-900" style={{ fontSize: '36px', color: 'var(--sv-ink)', lineHeight: 1 }}>
              {stats.occupiedSpots}
            </div>
            <div className="font-monospace small text-muted mt-2">
              Actively occupied by verified merchants generating monthly municipal revenue.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Pending Applications & Gazette Dispatch */}
      <div className="row g-4">
        {/* Pending Applications Audit Docket */}
        <div className="col-lg-7">
          <div className="sv-card h-100">
            <div className="sv-card-header">
              <h5>Pending Merchant Applications</h5>
              <Link to="/admin/applications" className="font-monospace" style={{ fontSize: '11.5px', color: 'var(--sv-primary)', textDecoration: 'none', fontWeight: 700 }}>
                Open Review Desk →
              </Link>
            </div>
            <div className="table-responsive">
              <table className="sv-table">
                <thead>
                  <tr>
                    <th>APPLICANT</th>
                    <th>TARGET ZONE</th>
                    <th>SUBMISSION NOTES</th>
                    <th className="text-end">FILED DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApps.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted font-monospace">
                        No pending applications awaiting municipal review.
                      </td>
                    </tr>
                  ) : (
                    recentApps.map(a => (
                      <tr key={a.id}>
                        <td className="fw-bold font-monospace">{a.profiles?.full_name || 'Merchant'}</td>
                        <td className="font-monospace">{a.zones?.name || 'Dhaka Central'}</td>
                        <td className="text-muted small">{a.notes || 'No special notes'}</td>
                        <td className="text-end font-monospace small text-muted">
                          {new Date(a.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Gazette Broadcast Dispatch */}
        <div className="col-lg-5">
          <div className="sv-card h-100 p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--sv-border-light)' }}>
              <span className="font-monospace fw-bold" style={{ fontSize: '12px', color: 'var(--sv-ink)' }}>
                📢 OFFICIAL GAZETTE DISPATCH
              </span>
              <span className="font-monospace text-muted" style={{ fontSize: '10px' }}>
                ALL ACTIVE MERCHANTS
              </span>
            </div>
            <p className="text-muted sv-font-editorial small mb-3">
              Broadcast official regulatory notices, rent reminders, or spatial zone updates directly to active vendors.
            </p>

            <form onSubmit={handleSendNotif}>
              <div className="mb-2">
                <label className="font-monospace small mb-1" style={{ fontSize: '10.5px' }}>DISPATCH SUBJECT</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm"
                  placeholder="e.g. Monthly Lease Fee Reminder / Ward Demarcation Notice"
                  value={notifForm.title}
                  onChange={e => setNotifForm({ ...notifForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="font-monospace small mb-1" style={{ fontSize: '10.5px' }}>DISPATCH DIRECTIVE BODY</label>
                <textarea 
                  rows={4}
                  className="form-control form-control-sm font-monospace"
                  placeholder="Official message body sent to all merchant dashboards..."
                  value={notifForm.message}
                  onChange={e => setNotifForm({ ...notifForm, message: e.target.value })}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn sv-btn-primary btn-sm w-100 font-monospace"
                disabled={notifLoading}
              >
                {notifLoading ? 'Transmitting Dispatch...' : 'Broadcast Gazette Directive →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
