import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ZoneMap from '../components/ZoneMap';

export default function VendorDashboard() {
  const [stats, setStats] = useState({ apps: 0, assignments: 0, complaints: 0, permissions: 0 });
  const [recentApps, setRecentApps] = useState([]);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [activePermission, setActivePermission] = useState(null);
  const [fullSpot, setFullSpot] = useState(null);
  const [fullZone, setFullZone] = useState(null);
  const { profile, getToken } = useAuth();

  useEffect(() => { loadDashboardData(); }, []);

  async function loadDashboardData() {
    const token = await getToken();
    const h = { Authorization: `Bearer ${token}` };
    const base = import.meta.env.VITE_API_URL;
    const [apps, assignments, complaints, permissions] = await Promise.all([
      axios.get(`${base}/applications`, { headers: h }).catch(() => ({ data: [] })),
      axios.get(`${base}/assignments`, { headers: h }).catch(() => ({ data: [] })),
      axios.get(`${base}/complaints`, { headers: h }).catch(() => ({ data: [] })),
      axios.get(`${base}/permissions`, { headers: h }).catch(() => ({ data: [] })),
    ]);
    setStats({
      apps: apps.data.length,
      assignments: assignments.data.filter(a => a.status === 'active').length,
      complaints: complaints.data.filter(c => c.status === 'open').length,
      permissions: permissions.data.filter(p => p.status === 'active').length,
    });
    setRecentApps(apps.data.slice(0, 5));
    
    const activeAsgn = assignments.data.find(a => a.status === 'active');
    const activePerm = permissions.data.find(p => p.status === 'active');
    setActiveAssignment(activeAsgn);
    setActivePermission(activePerm);

    if (activeAsgn) {
      try {
        const [zonesRes, blocksRes, spotsRes] = await Promise.all([
          axios.get(`${base}/zones`, { headers: h }),
          axios.get(`${base}/blocks`, { headers: h }),
          axios.get(`${base}/spots`, { headers: h })
        ]);
        
        const spotMatch = spotsRes.data.find(s => s.id === activeAsgn.spot_id);
        if (spotMatch) {
          setFullSpot(spotMatch);
          const blockMatch = blocksRes.data.find(b => b.id === spotMatch.block_id);
          if (blockMatch) {
            const zoneMatch = zonesRes.data.find(z => z.id === blockMatch.zone_id);
            if (zoneMatch) {
              setFullZone(zoneMatch);
            }
          }
        }
      } catch (err) {
        console.error("Failed robust map data load", err);
      }
    }
  }

  const statCards = [
    { icon: '📝', label: 'My Applications', value: stats.apps, color: '#1a6b3c', link: '/vendor/applications' },
    { icon: '📌', label: 'Active Spots', value: stats.assignments, color: '#2563eb', link: '/vendor/assignments' },
    { icon: '🔑', label: 'Active Permissions', value: stats.permissions, color: '#f59e0b', link: '/vendor/permissions' },
    { icon: '📣', label: 'Open Complaints', value: stats.complaints, color: '#ef4444', link: '/vendor/complaints' },
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="animate-entrance" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: 20, padding: '30px 40px', marginBottom: 30, marginTop: '-10px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Welcome, {profile?.full_name?.split(' ')[0]} 👋</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Manage your street vending operations and track your legal permissions.</div>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {statCards.map(s => (
          <div key={s.label} className="col-sm-6 col-xl-3">
            <Link to={s.link} style={{ textDecoration: 'none' }}>
              <div className="sv-stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-accent" style={{ background: s.color }}></div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Active Spot & Permission Section */}
      {activeAssignment ? (
        <div className="row g-4 mb-4 animate-entrance delay-2">
          <div className="col-lg-8">
            <div className="sv-card h-100 overflow-hidden d-flex flex-column" style={{ minHeight: 450, padding: 0 }}>
              <div className="sv-card-header d-flex justify-content-between align-items-center" style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9' }}>
                <h5 className="mb-0" style={{ fontSize: 16 }}>📍 My Active Spot</h5>
                <span className="badge bg-success px-3 py-2 rounded-pill shadow-sm" style={{ fontSize: 10 }}>ACTIVE</span>
              </div>
              <div className="flex-grow-1 position-relative" style={{ minHeight: 0 }}>
                <ZoneMap
                  zones={fullZone ? [fullZone] : []}
                  spotMarkers={fullSpot ? [fullSpot] : []}
                  selectedSpotId={fullSpot?.id}
                  viewOnly={true}
                  locked={false}
                  height="100%"
                  center={fullSpot?.latitude ? [parseFloat(fullSpot.latitude), parseFloat(fullSpot.longitude)] : null}
                />
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="sv-card h-100 border-0 shadow-lg" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderRadius: 20 }}>
              <div className="sv-card-header bg-transparent border-0 pt-4 px-4">
                <h6 className="text-uppercase fw-bold text-muted mb-0" style={{ letterSpacing: '1px', fontSize: 10 }}>Current Status</h6>
              </div>
              <div className="card-body px-4 pb-4">
                <div className="mb-4">
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="flex-shrink-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, fontSize: 18 }}>📍</div>
                    <div>
                      <div className="fs-2 fw-800 text-dark mb-0 lh-1">#{activeAssignment.spots?.spot_number}</div>
                      <div className="small text-muted fw-semibold uppercase">Assigned Spot</div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 rounded-4" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div className="fw-bold text-dark">{activeAssignment.spots?.blocks?.zones?.name}</div>
                    <div className="small text-muted">{activeAssignment.spots?.blocks?.block_name}</div>
                  </div>
                </div>

                <div className="mb-4 py-3 border-top border-bottom border-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="small text-muted fw-semibold">Monthly Rent</div>
                    <div className="fs-5 fw-800 text-success">৳{Number(activeAssignment.rent_amount).toFixed(0)}</div>
                  </div>
                </div>

                {activePermission && (
                  <div className="p-4 rounded-4 position-relative overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
                    <div className="position-absolute" style={{ top: -10, right: -10, fontSize: 40, opacity: 0.1 }}>🛡️</div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="fw-800 text-primary uppercase" style={{ fontSize: 11, letterSpacing: 1 }}>Legal Permission</span>
                    </div>
                    <div className="fs-6 fw-bold text-dark mb-1">{activePermission.permission_type}</div>
                    <div className="small text-muted">
                      Granted: <b>{new Date(activePermission.valid_from).toLocaleDateString(undefined, { dateStyle: 'medium' })}</b>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-2">
                  <Link to="/vendor/assignments" className="btn btn-primary w-100 py-3 shadow-sm" style={{ borderRadius: 12, fontWeight: 700 }}>View Full Details</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="sv-card mb-4 text-center py-5 animate-entrance delay-2">
          <div className="fs-1 mb-3">🏷️</div>
          <h5>No Active Spot Yet</h5>
          <p className="text-muted">Once an admin assigns you a spot, it will appear here on the map.</p>
          <Link to="/vendor/applications" className="btn btn-primary px-4" style={{ borderRadius: 8 }}>Apply for a Zone</Link>
        </div>
      )}
      <div className="sv-card">
        <div className="sv-card-header">
          <h5>Recent Applications</h5>
          <Link to="/vendor/applications" style={{ fontSize: 12, color: '#1a6b3c', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
        </div>
        <table className="sv-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Status</th>
              <th>Applied On</th>
            </tr>
          </thead>
          <tbody>
            {recentApps.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: 13 }}>No applications yet. <Link to="/vendor/applications">Apply for a zone</Link></td></tr>
            )}
            {recentApps.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>{a.zones?.name || '—'}</td>
                <td>
                  <span className={`sv-badge sv-badge-${a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}`}>{a.status}</span>
                </td>
                <td style={{ color: '#64748b', fontSize: 12 }}>{new Date(a.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
