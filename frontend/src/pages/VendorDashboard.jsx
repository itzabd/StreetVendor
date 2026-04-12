import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ZoneMap from '../components/ZoneMap';
import { generateLicensePDF } from '../utils/LicensePDF';

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

    if (activeAsgn && activeAsgn.spots) {
      setFullSpot(activeAsgn.spots);
      if (activeAsgn.spots.zones) {
        setFullZone(activeAsgn.spots.zones);
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
    <div className="vendor-dashboard-container animate-entrance">
      {/* Welcome Section */}
      <div className="dashboard-hero mb-5">
        <div className="hero-content">
          <h2 className="fw-900 mb-1">Welcome back, {profile?.full_name ? profile.full_name.split(' ')[0] : 'Merchant'}!</h2>
          <p className="opacity-75 mb-0">Track your street vending permits and manage your assigned spot in real-time.</p>
        </div>
        <div className="hero-status-pill">
          <span className="dot active"></span>
          <span className="label">Live Registry Active</span>
        </div>
      </div>

      {/* Modern Stat Grid */}
      <div className="row g-4 mb-5">
        {statCards.map((s, idx) => (
          <div key={s.label} className="col-sm-6 col-xl-3">
            <Link to={s.link} className="stat-card-modern sv-hover-lift">
              <div className="icon-box" style={{ background: s.color + '10', color: s.color }}>{s.icon}</div>
              <div className="content">
                <div className="value">{s.value}</div>
                <div className="label">{s.label}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Active Spot & Info Card */}
      {activeAssignment ? (
        <div className="row g-4 mb-5">
          <div className="col-lg-8">
            <div className="modern-glass-card h-100 overflow-hidden d-flex flex-column" style={{ minHeight: 480 }}>
              <div className="card-header-premium">
                <div className="d-flex align-items-center gap-2">
                  <span className="card-dot"></span>
                  <h5 className="mb-0 fw-800">Assigned Operational Spot</h5>
                </div>
                <span className="status-pill-green">LIVE TRACKING</span>
              </div>
              <div className="flex-grow-1">
                <ZoneMap
                  zones={fullZone ? [fullZone] : []}
                  spotMarkers={fullSpot ? [{ ...fullSpot, status: 'occupied' }] : []}
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
            <div className="modern-info-card h-100">
              <div className="id-stamp">Official Record</div>
              <div className="spot-identity mb-4">
                <div className="spot-number">#{activeAssignment.spots?.spot_number}</div>
                <div className="spot-details">
                  <div className="zone-name">{activeAssignment.spots?.zones?.name || fullZone?.name}</div>
                  <div className="block-name">{activeAssignment.spots?.block_name || 'Block Assigned'}</div>
                </div>
              </div>

              <div className="rent-strip mb-4">
                <span className="label">Monthly Rental</span>
                <span className="value">৳{Number(activeAssignment.rent_amount).toFixed(0)}</span>
              </div>

              {activePermission && (
                <div className="permission-artifact">
                  <div className="artifact-header">
                    <span className="icon">🛡️</span>
                    <span className="label">Legal Permit</span>
                  </div>
                  <h6 className="fw-800 mb-1">{activePermission.permission_type}</h6>
                  <p className="expiry">Valid from {new Date(activePermission.valid_from).toLocaleDateString()}</p>
                  
                  <button
                    onClick={() => generateLicensePDF({
                      vendorName:     profile?.full_name,
                      nidNumber:      profile?.nid_number || 'N/A',
                      phone:          profile?.phone,
                      address:        profile?.home_address || 'N/A',
                      tinNumber:      profile?.tin_number || 'N/A',
                      businessName:   profile?.business_name,
                      businessType:   profile?.business_type,
                      operatingHours: profile?.operating_hours,
                      avatar_url:     profile?.avatar_url,
                      permissionType: activePermission.permission_type,
                      zoneName:       activePermission.zones?.name || fullZone?.name,
                      spotNumber:     fullSpot?.spot_number,
                      latitude:       fullSpot?.latitude,
                      longitude:      fullSpot?.longitude,
                      validFrom:      activePermission.valid_from,
                      validUntil:     activePermission.valid_until,
                      licenseId:      activePermission.id,
                      issuedBy:       activePermission.issuer?.full_name || 'City Corporation Office',
                      designation:    'Licensing Officer',
                    })}
                    className="download-btn-modern"
                  >
                    📄 Download Official License
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state-card mb-5 animate-entrance">
          <div className="empty-icon">📍</div>
          <h4 className="fw-800">No Spot Assigned Yet</h4>
          <p className="text-muted">Applications being reviewed in the registry.</p>
          <Link to="/vendor/applications" className="btn-modern primary">Submit Application</Link>
        </div>
      )}

      {/* Recent Activity Table */}
      <div className="modern-glass-card">
        <div className="card-header-premium">
          <h5 className="mb-0 fw-800">Latest Applications</h5>
          <Link to="/vendor/applications" className="view-more">View Archive →</Link>
        </div>
        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Target Zone</th>
                <th>Processing Status</th>
                <th className="text-end">Filed Date</th>
              </tr>
            </thead>
            <tbody>
              {recentApps.length === 0 && (
                <tr><td colSpan={3} className="text-center py-5 text-muted">No applications found.</td></tr>
              )}
              {recentApps.map(a => (
                <tr key={a.id}>
                  <td className="fw-700 text-dark">{a.zones?.name || 'Vending Zone'}</td>
                  <td>
                    <span className={`status-pill-mini ${a.status}`}>
                      {a.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-end text-muted small fw-600">{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .vendor-dashboard-container { padding: 40px; max-width: 1200px; margin: 0 auto; background: #fdfdfd; }
        
        .dashboard-hero { background: #1e293b; color: #fff; padding: 40px; border-radius: 24px; display: flex; justify-content: space-between; align-items: center; }
        .hero-status-pill { background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 100px; display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .hero-status-pill .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 10px #22c55e; }

        .stat-card-modern { background: #fff; border: 1px solid #edf2f7; padding: 24px; border-radius: 20px; display: flex; align-items: center; gap: 20px; transition: 0.3s; text-decoration: none; }
        .stat-card-modern:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .stat-card-modern .icon-box { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        .stat-card-modern .value { font-size: 24px; font-weight: 900; color: #1e293b; line-height: 1; margin-bottom: 2px; }
        .stat-card-modern .label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.02em; }

        .modern-glass-card { background: #fff; border: 1px solid #edf2f7; border-radius: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .card-header-premium { padding: 24px 30px; border-bottom: 1px solid #f8fafc; display: flex; justify-content: space-between; align-items: center; }
        .card-dot { width: 10px; height: 10px; background: #1a6b3c; border-radius: 2px; }
        .status-pill-green { background: #dcfce7; color: #166534; font-size: 10px; font-weight: 800; padding: 6px 14px; border-radius: 100px; }

        .modern-info-card { background: #fff; border: 1px solid #edf2f7; border-radius: 24px; padding: 30px; display: flex; flex-direction: column; position: relative; }
        .id-stamp { position: absolute; top: 30px; right: 30px; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #94a3b8; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 6px; }
        .spot-number { font-size: 48px; font-weight: 900; color: #1e293b; letter-spacing: -2px; line-height: 1; }
        .zone-name { font-size: 18px; font-weight: 800; color: #1a6b3c; margin-top: 5px; }
        .block-name { font-size: 13px; font-weight: 600; color: #64748b; }

        .rent-strip { background: #f8fafc; padding: 16px 20px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; }
        .rent-strip .label { font-size: 12px; font-weight: 700; color: #64748b; }
        .rent-strip .value { font-size: 18px; font-weight: 900; color: #1a6b3c; }

        .permission-artifact { background: linear-gradient(135deg, #1a6b3c, #155730); border-radius: 20px; padding: 24px; color: #fff; box-shadow: 0 15px 35px rgba(26, 107, 60, 0.2); }
        .artifact-header { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; }
        .artifact-header .label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; }
        .permission-artifact .expiry { font-size: 11px; opacity: 0.7; margin-bottom: 20px; }
        .download-btn-modern { width: 100%; padding: 12px; border-radius: 12px; border: none; background: rgba(255,255,255,0.1); color: #fff; font-weight: 800; font-size: 12px; transition: 0.3s; backdrop-filter: blur(10px); }
        .download-btn-modern:hover { background: #fff; color: #1a6b3c; transform: translateY(-2px); }

        .modern-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .modern-table th { background: #fcfdfe; padding: 16px 30px; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #f8fafc; }
        .modern-table td { padding: 16px 30px; vertical-align: middle; border-bottom: 1px solid #fcfdfe; }
        
        .status-pill-mini { padding: 4px 12px; border-radius: 8px; font-size: 10px; font-weight: 800; }
        .status-pill-mini.approved { background: #dcfce7; color: #166534; }
        .status-pill-mini.pending { background: #fef9c3; color: #854d0e; }
        .status-pill-mini.rejected { background: #fee2e2; color: #991b1b; }

        .btn-modern.primary { background: #1a6b3c; color: #fff; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 800; text-decoration: none; display: inline-block; }
        .view-more { font-size: 12px; font-weight: 700; color: #1a6b3c; text-decoration: none; }

        .empty-state-card { background: #fff; border: 2px dashed #e2e8f0; border-radius: 24px; padding: 60px; text-align: center; }
        .empty-icon { font-size: 40px; margin-bottom: 20px; opacity: 0.5; }

        @keyframes svIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-entrance { animation: svIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}
