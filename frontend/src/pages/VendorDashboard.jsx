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
  const { profile, getToken, isDemo } = useAuth();

  useEffect(() => { loadDashboardData(); }, [isDemo]);

  async function loadDashboardData() {
    const token = await getToken();
    const h = { Authorization: `Bearer ${token}` };
    const base = import.meta.env.VITE_API_URL;
    const [appsRes, asgnRes, compRes, permRes] = await Promise.all([
      axios.get(`${base}/applications`, { headers: h }).catch(() => ({ data: [] })),
      axios.get(`${base}/assignments`, { headers: h }).catch(() => ({ data: [] })),
      axios.get(`${base}/complaints`, { headers: h }).catch(() => ({ data: [] })),
      axios.get(`${base}/permissions`, { headers: h }).catch(() => ({ data: [] })),
    ]);

    let apps = appsRes.data || [];
    let assignments = asgnRes.data || [];
    let complaints = compRes.data || [];
    let permissions = permRes.data || [];

    if (isDemo && assignments.length === 0) {
      assignments = [{
        id: 'asgn-demo-01',
        vendor_id: profile?.id,
        status: 'active',
        rent_amount: 3500,
        spots: {
          id: 'spot-03',
          spot_number: 'M10-04',
          latitude: 23.8068,
          longitude: 90.3687,
          status: 'occupied',
          block_name: 'Block A (North Sector)',
          zones: { name: 'Mirpur Commercial Hub', area: 'Zone-4, Mirpur' }
        }
      }];
    }

    if (isDemo && permissions.length === 0) {
      permissions = [{
        id: 'perm-demo-01',
        permission_type: 'Official Street Vending Permit (Class A)',
        valid_from: '2026-01-01',
        valid_until: '2026-12-31',
        status: 'active',
        zones: { name: 'Mirpur Commercial Hub' },
        issuer: { full_name: 'Tanvir Ahmed (City Licensing Officer)' }
      }];
    }

    if (isDemo && apps.length === 0) {
      apps = [{
        id: 'app-demo-01',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: 'approved',
        zones: { name: 'Mirpur Commercial Hub' }
      }];
    }

    setStats({
      apps: apps.length,
      assignments: assignments.filter(a => a.status === 'active').length,
      complaints: complaints.filter(c => c.status === 'open').length,
      permissions: permissions.filter(p => p.status === 'active').length,
    });
    setRecentApps(apps.slice(0, 5));

    const activeAsgn = assignments.find(a => a.status === 'active');
    const activePerm = permissions.find(p => p.status === 'active');
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
    { label: 'Spot Applications', value: stats.apps, link: '/vendor/applications', tag: 'Filed Records' },
    { label: 'Active Demarcation', value: stats.assignments, link: '/vendor/assignments', tag: 'Designated Spot' },
    { label: 'Verified Licenses', value: stats.permissions, link: '/vendor/permissions', tag: 'Legal Permits' },
    { label: 'Grievance Cases', value: stats.complaints, link: '/vendor/complaints', tag: 'Open Inquiries' },
  ];

  return (
    <div className="sv-vendor-docket-wrap">
      {/* Merchant Ledger Header */}
      <div className="sv-card mb-4" style={{ borderLeft: '5px solid var(--sv-primary)' }}>
        <div className="p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="sv-badge sv-badge-success">
                ● LIVE REGISTRY ACTIVE
              </span>
              <span className="font-monospace text-muted" style={{ fontSize: '11px' }}>
                NID/TIN SYNCHRONIZED
              </span>
            </div>
            <h2 className="mb-1 fw-800" style={{ fontSize: '26px' }}>
              Merchant Trade Desk: {profile?.business_name || profile?.full_name || 'Rahim Uddin'}
            </h2>
            <p className="mb-0 text-muted sv-font-editorial" style={{ fontSize: '15px' }}>
              Official spatial spot assignment, lease payments, and authenticated QR verification records.
            </p>
          </div>

          <div className="font-monospace text-end">
            <div style={{ fontSize: '11px', color: 'var(--sv-ink-muted)' }}>MUNICIPAL WARD RECORD</div>
            <div className="fw-bold" style={{ fontSize: '14px', color: 'var(--sv-primary)' }}>
              {activeAssignment?.spots?.zones?.name || 'Dhaka North City Corp.'}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Ledger Stat Grid */}
      <div className="row g-3 mb-4">
        {statCards.map(s => (
          <div key={s.label} className="col-sm-6 col-xl-3">
            <Link to={s.link} style={{ textDecoration: 'none' }}>
              <div className="sv-stat-card">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="sv-stat-label">{s.label}</span>
                  <span className="font-monospace" style={{ fontSize: '10px', color: 'var(--sv-ink-light)' }}>
                    {s.tag}
                  </span>
                </div>
                <div className="sv-stat-value">{s.value}</div>
                <div className="font-monospace mt-1" style={{ fontSize: '11px', color: 'var(--sv-primary)' }}>
                  Inspect Ledger →
                </div>
                <div className="sv-stat-accent" style={{ background: 'var(--sv-primary)' }}></div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Active Spot & Verification Docket */}
      {activeAssignment ? (
        <div className="row g-4 mb-4">
          {/* Spatial Map Viewport */}
          <div className="col-lg-7">
            <div className="sv-card h-100 d-flex flex-column">
              <div className="sv-card-header">
                <div className="d-flex align-items-center gap-2">
                  <span className="font-monospace fw-bold text-dark" style={{ fontSize: '12px' }}>
                    📍 DESIGNATED SPATIAL POSITION ON GIS CANVAS
                  </span>
                </div>
                <span className="sv-badge sv-badge-success">
                  ACTIVE LEASE
                </span>
              </div>
              <div className="flex-grow-1" style={{ minHeight: '380px', position: 'relative' }}>
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

          {/* Demarcation Docket & License Certificate Box */}
          <div className="col-lg-5">
            <div className="sv-card h-100 p-4 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--sv-border-light)' }}>
                  <span className="font-monospace fw-bold" style={{ fontSize: '11px', color: 'var(--sv-primary)' }}>
                    DEMARCATION CERTIFICATE
                  </span>
                  <span className="sv-badge sv-badge-warning">
                    SPOT RECORD
                  </span>
                </div>

                <div className="mb-3">
                  <div className="font-monospace" style={{ fontSize: '11px', color: 'var(--sv-ink-muted)' }}>DESIGNATED SPOT IDENTIFIER</div>
                  <div className="fw-900 font-monospace" style={{ fontSize: '36px', lineHeight: 1.1, color: 'var(--sv-ink)' }}>
                    #{activeAssignment.spots?.spot_number || 'M10-04'}
                  </div>
                  <div className="fw-bold mt-1" style={{ fontSize: '15px', color: 'var(--sv-primary)' }}>
                    {activeAssignment.spots?.zones?.name || fullZone?.name}
                  </div>
                  <div className="font-monospace small text-muted">
                    Sector: {activeAssignment.spots?.block_name || 'Commercial Corridor Block A'}
                  </div>
                </div>

                {/* Lease Details */}
                <div className="p-3 mb-3" style={{ background: 'var(--sv-bg-muted)', border: '1px solid var(--sv-border)' }}>
                  <div className="d-flex justify-content-between align-items-center font-monospace">
                    <span style={{ fontSize: '11.5px', color: 'var(--sv-ink-muted)' }}>MUNICIPAL LEASE FEE:</span>
                    <span className="fw-bold" style={{ fontSize: '16px', color: 'var(--sv-ink)' }}>
                      ৳{Number(activeAssignment.rent_amount || 3500).toLocaleString()}/month
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center font-monospace mt-1" style={{ fontSize: '11px', color: 'var(--sv-ink-light)' }}>
                    <span>STATUS: CURRENT</span>
                    <span>DUE DATE: 10TH EACH MONTH</span>
                  </div>
                </div>
              </div>

              {/* Official License Download */}
              {activePermission && (
                <div className="p-3" style={{ background: 'var(--sv-primary-dark)', color: '#F7F5EE', border: '1px solid var(--sv-border)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="font-monospace fw-bold" style={{ fontSize: '10.5px', color: '#C58A2B' }}>
                      OFFICIAL TRADE PERMIT
                    </span>
                    <span className="font-monospace" style={{ fontSize: '10px', opacity: 0.8 }}>
                      CLASS A LICENSE
                    </span>
                  </div>
                  <div className="fw-bold mb-1" style={{ fontSize: '13px' }}>
                    {activePermission.permission_type}
                  </div>
                  <div className="font-monospace mb-3" style={{ fontSize: '11px', opacity: 0.75 }}>
                    VALIDITY: {activePermission.valid_from} TO {activePermission.valid_until}
                  </div>

                  <button
                    onClick={() => generateLicensePDF({
                      vendorName:     profile?.full_name || 'Rahim Uddin',
                      nidNumber:      profile?.nid_number || '1988269012345678',
                      phone:          profile?.phone || '+880 1711-234567',
                      address:        profile?.home_address || 'Section 10, Mirpur, Dhaka',
                      tinNumber:      profile?.tin_number || '5421980341',
                      businessName:   profile?.business_name || "Rahim's Tea & Fuchka Corner",
                      businessType:   profile?.business_type || 'Street Food & Beverage',
                      operatingHours: profile?.operating_hours || '07:00 AM - 10:30 PM',
                      avatar_url:     profile?.avatar_url,
                      permissionType: activePermission.permission_type,
                      zoneName:       activePermission.zones?.name || fullZone?.name || 'Mirpur Commercial Hub',
                      spotNumber:     fullSpot?.spot_number || 'M10-04',
                      latitude:       fullSpot?.latitude || 23.8068,
                      longitude:      fullSpot?.longitude || 90.3687,
                      validFrom:      activePermission.valid_from,
                      validUntil:     activePermission.valid_until,
                      licenseId:      activePermission.id,
                      issuedBy:       activePermission.issuer?.full_name || 'City Licensing Officer (Tanvir Ahmed)',
                      designation:    'Licensing Officer',
                    })}
                    className="btn btn-sm w-100 font-monospace"
                    style={{ background: '#C58A2B', color: '#141716', border: '1px solid #141716', fontWeight: 700 }}
                  >
                    📄 Generate Official Verified License PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="sv-card p-5 text-center mb-4 font-monospace">
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📍</div>
          <h4 className="fw-800">No Spatial Spot Assigned Yet</h4>
          <p className="text-muted small mb-3">
            Submit a formal trade spot allocation application to obtain a designated vending position.
          </p>
          <Link to="/vendor/applications" className="btn sv-btn-primary btn-sm px-4">
            Submit Spot Application →
          </Link>
        </div>
      )}

      {/* Recent Applications Audit Table */}
      <div className="sv-card">
        <div className="sv-card-header">
          <h5>Recent Application Dockets</h5>
          <Link to="/vendor/applications" className="font-monospace" style={{ fontSize: '11.5px', color: 'var(--sv-primary)', textDecoration: 'none', fontWeight: 700 }}>
            View All Applications →
          </Link>
        </div>
        <div className="table-responsive">
          <table className="sv-table">
            <thead>
              <tr>
                <th>TARGET ZONE</th>
                <th>APPLICATION DOCKET STATUS</th>
                <th className="text-end">SUBMISSION DATE</th>
              </tr>
            </thead>
            <tbody>
              {recentApps.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-4 text-muted font-monospace">No applications filed in registry.</td></tr>
              ) : (
                recentApps.map(a => (
                  <tr key={a.id}>
                    <td className="fw-bold font-monospace">{a.zones?.name || 'Mirpur Commercial Hub'}</td>
                    <td>
                      <span className={`sv-badge ${a.status === 'approved' ? 'sv-badge-success' : a.status === 'pending' ? 'sv-badge-warning' : 'sv-badge-danger'}`}>
                        {a.status}
                      </span>
                    </td>
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
  );
}
