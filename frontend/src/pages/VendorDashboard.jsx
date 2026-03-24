import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VendorDashboard() {
  const [stats, setStats] = useState({ apps: 0, assignments: 0, complaints: 0, permissions: 0 });
  const [recentApps, setRecentApps] = useState([]);
  const { profile, getToken } = useAuth();

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
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
      <div style={{ background: 'linear-gradient(135deg, #1a6b3c, #2d8f55)', borderRadius: 14, padding: '22px 28px', marginBottom: 24, color: '#fff' }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Welcome, {profile?.full_name?.split(' ')[0]} 👋</div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>Here's a summary of your vendor activity on StreetVendor BD.</div>
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

      {/* Recent Applications */}
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
