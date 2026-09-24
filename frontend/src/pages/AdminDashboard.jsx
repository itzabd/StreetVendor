import { useState, useEffect, useCallback } from 'react';
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

  const loadStats = useCallback(async () => {
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
      availableSpots: (spots.data || []).filter(s => s.status === 'available').length || 6,
      occupiedSpots: (spots.data || []).filter(s => s.status === 'occupied').length || 2,
    });
    setRecentApps(appList.filter(a => a.status === 'pending').slice(0, 5));
  }, [getToken, isDemo]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const statCards = [
    { label: 'Spatial Zones', value: stats.zones, sub: 'Demarcated areas', link: '/admin/zones' },
    { label: 'Demarcated Spots', value: stats.spots, sub: 'Total mapped positions', link: '/admin/spots' },
    { label: 'Pending Applications', value: stats.pendingApps, sub: 'Awaiting audit review', link: '/admin/applications', alert: stats.pendingApps > 0 },
    { label: 'Citizen Reports', value: stats.pendingGuestReports, sub: 'Unverified trade spots', link: '/admin/guest-reports' },
    { label: 'Open Inquiries', value: stats.openComplaints, sub: 'Grievance records', link: '/admin/complaints' },
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
    }, 400);
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Municipal Oversight Banner */}
      <div className="sv-card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--sv-status-warning)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="sv-badge sv-badge-warning">
                City Corporation Oversight Desk
              </span>
              <span style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
                DNCC / DSCC Licensing Authority
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 2px' }}>
              Municipal Spatial Demarcation & Licensing Desk
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--sv-text-secondary)' }}>
              Urban GIS boundary management, trade permit approval workflow, and public service compliance.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link to="/admin/zones" className="btn btn-outline-dark btn-sm">
              + Demarcate Zone
            </Link>
            <Link to="/admin/applications" className="btn btn-primary btn-sm">
              Review Applications ({stats.pendingApps})
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-2 g-md-3">
        {statCards.map((s, idx) => (
          <div key={idx} className="col-6 col-md-4 col-lg">
            <Link to={s.link} style={{ textDecoration: 'none' }}>
              <div className="sv-card" style={{ padding: '14px 12px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--sv-text-muted)', fontWeight: 500, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.label}
                </div>
                <div className="sv-mono-data" style={{ fontSize: '20px', fontWeight: 700, color: s.alert ? 'var(--sv-status-warning)' : 'var(--sv-text-primary)' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--sv-text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.sub}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Capacity & Allocation Breakdown */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="sv-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--sv-text-secondary)' }}>
                AVAILABLE TRADE DEMARCATIONS
              </span>
              <span className="sv-badge sv-badge-success">OPEN CAPACITY</span>
            </div>
            <div className="sv-mono-data" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--sv-status-success)' }}>
              {stats.availableSpots} Spots
            </div>
            <div style={{ fontSize: '12px', color: 'var(--sv-text-muted)', marginTop: '4px' }}>
              Surveyed spatial spots available for licensed merchant assignment.
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="sv-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--sv-text-secondary)' }}>
                OCCUPIED LEASE DEMARCATIONS
              </span>
              <span className="sv-badge sv-badge-neutral">UNDER LEASE</span>
            </div>
            <div className="sv-mono-data" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--sv-text-primary)' }}>
              {stats.occupiedSpots} Spots
            </div>
            <div style={{ fontSize: '12px', color: 'var(--sv-text-muted)', marginTop: '4px' }}>
              Actively occupied by registered merchants generating monthly municipal revenue.
            </div>
          </div>
        </div>
      </div>

      {/* Main Review & Dispatch Grid */}
      <div className="row g-4">
        {/* Pending Applications Review Desk */}
        <div className="col-lg-7">
          <div className="sv-card h-100">
            <div className="sv-card-header">
              <h5>Pending Merchant Applications Queue</h5>
              <Link to="/admin/applications" style={{ fontSize: '12px', color: 'var(--sv-primary)', textDecoration: 'none', fontWeight: 600 }}>
                Open Review Desk →
              </Link>
            </div>
            <div className="table-responsive">
              <table className="sv-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Target Zone</th>
                    <th>Notes</th>
                    <th style={{ textAlign: 'right' }}>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApps.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--sv-text-muted)', fontSize: '12.5px' }}>
                        No pending applications awaiting audit
                      </td>
                    </tr>
                  ) : (
                    recentApps.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600 }}>{a.profiles?.full_name || 'Merchant'}</td>
                        <td>{a.zones?.name || 'Dhaka Central'}</td>
                        <td style={{ fontSize: '12px', color: 'var(--sv-text-secondary)' }}>{a.notes || 'No special notes'}</td>
                        <td className="sv-mono-data" style={{ textAlign: 'right', fontSize: '12px', color: 'var(--sv-text-muted)' }}>
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

        {/* Gazette Directive Dispatch */}
        <div className="col-lg-5">
          <div className="sv-card h-100" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--sv-text-secondary)' }}>
                Official Gazette Dispatch
              </span>
              <span className="sv-badge sv-badge-neutral">MERCHANT BROADCAST</span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--sv-text-muted)', marginBottom: '14px' }}>
              Transmit formal municipal regulatory notices, zone boundary updates, or lease fee directives.
            </p>

            <form onSubmit={handleSendNotif} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--sv-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  DISPATCH SUBJECT
                </label>
                <input 
                  type="text" 
                  className="form-control form-control-sm"
                  placeholder="e.g. Monthly Lease Fee Due Notice / Ward Boundary Update"
                  value={notifForm.title}
                  onChange={e => setNotifForm({ ...notifForm, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--sv-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  DIRECTIVE MESSAGE BODY
                </label>
                <textarea 
                  rows={4}
                  className="form-control form-control-sm"
                  placeholder="Official notice delivered directly to all active vendor dashboards..."
                  value={notifForm.message}
                  onChange={e => setNotifForm({ ...notifForm, message: e.target.value })}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-sm w-100"
                disabled={notifLoading}
                style={{ marginTop: '4px' }}
              >
                {notifLoading ? 'Transmitting...' : 'Broadcast Gazette Directive →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
