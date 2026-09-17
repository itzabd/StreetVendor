import { useState, useEffect, useCallback } from 'react';
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

  const loadDashboardData = useCallback(async () => {
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
  }, [getToken, isDemo, profile?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleDownloadLicense = () => {
    generateLicensePDF({
      vendorName:     profile?.full_name || 'Rahim Uddin',
      nidNumber:      profile?.nid_number || '1988269012345678',
      phone:          profile?.phone || '+880 1711-234567',
      address:        profile?.home_address || 'Section 10, Mirpur, Dhaka',
      tinNumber:      profile?.tin_number || '5421980341',
      businessName:   profile?.business_name || "Rahim's Tea & Fuchka Corner",
      businessType:   profile?.business_type || 'Street Food & Beverage',
      operatingHours: profile?.operating_hours || '07:00 AM - 10:30 PM',
      avatar_url:     profile?.avatar_url,
      permissionType: activePermission?.permission_type || 'Class A Street Vending License',
      zoneName:       activePermission?.zones?.name || fullZone?.name || 'Mirpur Commercial Hub',
      spotNumber:     fullSpot?.spot_number || 'M10-04',
      latitude:       fullSpot?.latitude || 23.8068,
      longitude:      fullSpot?.longitude || 90.3687,
      validFrom:      activePermission?.valid_from || '2026-01-01',
      validUntil:     activePermission?.valid_until || '2026-12-31',
      licenseId:      activePermission?.id || 'perm-demo-01',
      issuedBy:       activePermission?.issuer?.full_name || 'City Licensing Officer (Tanvir Ahmed)',
      designation:    'Licensing Officer',
    });
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Merchant Overview Banner */}
      <div className="sv-card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--sv-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="sv-badge sv-badge-success">
                Active Spot Allocation
              </span>
              <span style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
                Ward: {activeAssignment?.spots?.zones?.name || 'Mirpur Commercial Hub'}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 2px' }}>
              {profile?.business_name || "Rahim's Tea & Fuchka Corner"}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--sv-text-secondary)' }}>
              Operator: {profile?.full_name || 'Rahim Uddin'} · Phone: {profile?.phone || '+880 1711-234567'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/vendor/applications" className="btn btn-outline-dark btn-sm">
              New Spot Application
            </Link>
            <button onClick={handleDownloadLicense} className="btn btn-primary btn-sm">
              📄 Verified License PDF
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3">
        {[
          { label: 'Assigned Spot', value: activeAssignment ? `#${activeAssignment.spots?.spot_number || 'M10-04'}` : 'None', sub: 'Designated trade position', link: '/vendor/assignments' },
          { label: 'Monthly Lease', value: activeAssignment ? `৳${Number(activeAssignment.rent_amount || 3500).toLocaleString()}` : '—', sub: 'Due 10th of each month', link: '/vendor/rent' },
          { label: 'Active Permits', value: stats.permissions, sub: 'Verified legal permissions', link: '/vendor/permissions' },
          { label: 'Open Inquiries', value: stats.complaints, sub: 'Grievance / resolution cases', link: '/vendor/complaints' },
        ].map((m, idx) => (
          <div key={idx} className="col-sm-6 col-lg-3">
            <Link to={m.link} style={{ textDecoration: 'none' }}>
              <div className="sv-card" style={{ padding: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--sv-text-muted)', fontWeight: 500, marginBottom: '4px' }}>
                  {m.label}
                </div>
                <div className="sv-mono-data" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--sv-text-primary)' }}>
                  {m.value}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--sv-text-secondary)', marginTop: '2px' }}>
                  {m.sub}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="row g-4">
        {/* Left Column: Interactive GIS Spot View & History */}
        <div className="col-lg-7">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* GIS Spot Map */}
            <div className="sv-card">
              <div className="sv-card-header">
                <h5>Designated GIS Trade Position</h5>
                <span className="sv-mono-data" style={{ fontSize: '11px', color: 'var(--sv-text-muted)' }}>
                  {fullSpot?.latitude ? `${parseFloat(fullSpot.latitude).toFixed(4)}°N, ${parseFloat(fullSpot.longitude).toFixed(4)}°E` : '23.8068°N, 90.3687°E'}
                </span>
              </div>
              <div style={{ height: '360px', position: 'relative' }}>
                <ZoneMap
                  zones={fullZone ? [fullZone] : []}
                  spotMarkers={fullSpot ? [{ ...fullSpot, status: 'occupied' }] : []}
                  selectedSpotId={fullSpot?.id}
                  viewOnly={true}
                  hideDefaultLegend={true}
                  height="100%"
                  center={fullSpot?.latitude ? [parseFloat(fullSpot.latitude), parseFloat(fullSpot.longitude)] : [23.8068, 90.3687]}
                />
              </div>
            </div>

            {/* Applications Table */}
            <div className="sv-card">
              <div className="sv-card-header">
                <h5>Application Records</h5>
                <Link to="/vendor/applications" style={{ fontSize: '12px', color: 'var(--sv-primary)', textDecoration: 'none', fontWeight: 600 }}>
                  View All →
                </Link>
              </div>
              <div className="table-responsive">
                <table className="sv-table">
                  <thead>
                    <tr>
                      <th>Target Zone</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Date Filed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApps.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--sv-text-muted)', fontSize: '12.5px' }}>
                          No application history found
                        </td>
                      </tr>
                    ) : (
                      recentApps.map(a => (
                        <tr key={a.id}>
                          <td style={{ fontWeight: 600 }}>{a.zones?.name || 'Mirpur Commercial Hub'}</td>
                          <td>
                            <span className={`sv-badge ${a.status === 'approved' ? 'sv-badge-success' : a.status === 'pending' ? 'sv-badge-warning' : 'sv-badge-danger'}`}>
                              {a.status.toUpperCase()}
                            </span>
                          </td>
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
        </div>

        {/* Right Column: Demarcation & License Details */}
        <div className="col-lg-5">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Spot Demarcation Details */}
            <div className="sv-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--sv-border)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--sv-text-secondary)' }}>
                  Spot Demarcation Record
                </span>
                <span className="sv-badge sv-badge-success">
                  Active Lease
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--sv-text-muted)', textTransform: 'uppercase' }}>Spot Code</div>
                <div className="sv-mono-data" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--sv-primary)' }}>
                  #{activeAssignment?.spots?.spot_number || 'M10-04'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sv-text-primary)', marginTop: '2px' }}>
                  {activeAssignment?.spots?.zones?.name || 'Mirpur Commercial Hub'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--sv-text-secondary)' }}>
                  {activeAssignment?.spots?.block_name || 'Block A (North Sector)'}
                </div>
              </div>

              {/* Monthly Lease Fee Info */}
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--sv-surface-subtle)',
                border: '1px solid var(--sv-border)',
                borderRadius: 'var(--sv-radius)',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--sv-text-secondary)' }}>Monthly Municipal Fee:</span>
                  <span className="sv-mono-data" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--sv-text-primary)' }}>
                    ৳{Number(activeAssignment?.rent_amount || 3500).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--sv-text-muted)' }}>
                  <span>Status: Verified Current</span>
                  <span>Due: 10th of month</span>
                </div>
              </div>

              {/* Verified Legal Permit Card */}
              {activePermission && (
                <div style={{
                  padding: '14px',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 'var(--sv-radius)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#166534' }}>
                      Official Trade License
                    </span>
                    <span className="sv-mono-data" style={{ fontSize: '10.5px', color: '#166534' }}>
                      CLASS A
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#14532D', marginBottom: '4px' }}>
                    {activePermission.permission_type}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#166534', marginBottom: '12px' }}>
                    Valid: {activePermission.valid_from} to {activePermission.valid_until}
                  </div>

                  <button
                    onClick={handleDownloadLicense}
                    className="btn btn-primary btn-sm w-100"
                  >
                    📄 Export Verified License PDF
                  </button>
                </div>
              )}
            </div>

            {/* Merchant Identity Quick View */}
            <div className="sv-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--sv-text-secondary)', marginBottom: '12px' }}>
                Registry Identity
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--sv-text-muted)' }}>National ID (NID):</span>
                  <span className="sv-mono-data">{profile?.nid_number || '1988269012345678'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--sv-text-muted)' }}>TIN Number:</span>
                  <span className="sv-mono-data">{profile?.tin_number || '5421980341'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--sv-text-muted)' }}>Operating Hours:</span>
                  <span>{profile?.operating_hours || '07:00 AM - 10:30 PM'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--sv-text-muted)' }}>License Issuer:</span>
                  <span>{activePermission?.issuer?.full_name || 'City Licensing Office'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
