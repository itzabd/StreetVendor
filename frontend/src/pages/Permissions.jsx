import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { generateLicensePDF } from '../utils/LicensePDF';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function Permissions() {
  const { addToast } = useToast();
  const { confirmAction } = useConfirm();
  const location = useLocation();
  const [permissions, setPermissions] = useState([]);
  const [zones, setZones] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [approvedApps, setApprovedApps] = useState([]);
  
  const [formData, setFormData] = useState({ 
    vendor_id: '', 
    zone_id: '', 
    permission_type: 'Official Street Vending Permit (Class A)', 
    valid_from: new Date().toISOString().split('T')[0], 
    valid_until: '2026-12-31', 
    notes: '' 
  });
  
  const { profile, getToken, isDemo } = useAuth();
  const isAdmin = profile?.role === 'admin';

  async function loadPermissions() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/permissions`, { headers: { Authorization: `Bearer ${token}` } });
      let list = res.data || [];
      if (isDemo && list.length === 0) {
        list = [
          {
            id: 'perm-demo-01',
            permission_type: 'Official Street Vending Permit (Class A)',
            valid_from: '2026-01-01',
            valid_until: '2026-12-31',
            status: 'active',
            vendor_id: profile?.id || 'vendor-01',
            profiles: {
              full_name: 'Rahim Uddin',
              business_name: "Rahim's Tea & Fuchka Corner",
              phone: '+880 1711-234567',
              nid_number: '1988269012345678',
              tin_number: '5421980341',
              home_address: 'Section 10, Mirpur, Dhaka-1216',
              business_type: 'Street Food & Beverage',
              operating_hours: '07:00 AM - 10:30 PM'
            },
            spots: {
              spot_number: 'M10-04',
              latitude: 23.8068,
              longitude: 90.3687
            },
            zones: { name: 'Mirpur Commercial Hub' },
            issuer: { full_name: 'Tanvir Ahmed (City Licensing Officer)' }
          }
        ];
      }
      setPermissions(list);
    } catch {
      if (isDemo) {
        setPermissions([
          {
            id: 'perm-demo-01',
            permission_type: 'Official Street Vending Permit (Class A)',
            valid_from: '2026-01-01',
            valid_until: '2026-12-31',
            status: 'active',
            vendor_id: profile?.id || 'vendor-01',
            profiles: {
              full_name: 'Rahim Uddin',
              business_name: "Rahim's Tea & Fuchka Corner",
              phone: '+880 1711-234567',
              nid_number: '1988269012345678',
              tin_number: '5421980341',
              home_address: 'Section 10, Mirpur, Dhaka-1216',
              business_type: 'Street Food & Beverage',
              operating_hours: '07:00 AM - 10:30 PM'
            },
            spots: {
              spot_number: 'M10-04',
              latitude: 23.8068,
              longitude: 90.3687
            },
            zones: { name: 'Mirpur Commercial Hub' },
            issuer: { full_name: 'Tanvir Ahmed (City Licensing Officer)' }
          }
        ]);
      }
    }
  }

  async function loadZones() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
      setZones(res.data && res.data.length > 0 ? res.data : [
        { id: 'zone-01', name: 'Mirpur Commercial Hub' },
        { id: 'zone-02', name: 'Karwan Bazar Trade Corridor' }
      ]);
    } catch {
      setZones([
        { id: 'zone-01', name: 'Mirpur Commercial Hub' },
        { id: 'zone-02', name: 'Karwan Bazar Trade Corridor' }
      ]);
    }
  }

  async function loadVendors() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/applications`, { headers: { Authorization: `Bearer ${token}` } });
      const mapped = (res.data || []).map(a => ({ id: a.vendor_id, name: a.profiles?.full_name }));
      const unique = Array.from(new Map(mapped.map(item => [item.id, item])).values());
      setVendors(unique.length > 0 ? unique : [
        { id: 'vendor-01', name: 'Rahim Uddin' },
        { id: 'vendor-02', name: 'Abdul Malek' }
      ]);
      setApprovedApps((res.data || []).filter(a => a.status === 'approved'));
    } catch {
      setVendors([
        { id: 'vendor-01', name: 'Rahim Uddin' },
        { id: 'vendor-02', name: 'Abdul Malek' }
      ]);
    }
  }

  useEffect(() => { 
    loadPermissions(); 
    if (isAdmin) {
      loadZones();
      loadVendors();

      if (location.state) {
        const { vendor_id, zone_id } = location.state;
        if (vendor_id) setFormData(prev => ({ ...prev, vendor_id }));
        if (zone_id) setFormData(prev => ({ ...prev, zone_id }));
        addToast('Form pre-filled from application dossier!', 'info');
      }
    }
  }, [isAdmin, isDemo, location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVendorChange = (vendorId) => {
    setFormData(prev => ({ ...prev, vendor_id: vendorId }));
    if (!vendorId) return;

    const app = approvedApps.find(a => a.vendor_id === vendorId);
    if (app && app.zone_id) {
      setFormData(prev => ({ ...prev, zone_id: app.zone_id }));
      addToast(`Identified application for ${app.zones?.name}. Auto-selected zone.`, 'info');
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/permissions`, formData, { headers: { Authorization: `Bearer ${token}` } });
      
      const allNotifs = JSON.parse(localStorage.getItem('sv_notifications') || '[]');
      allNotifs.unshift({
        id: Date.now().toString(),
        target_vendor_id: formData.vendor_id,
        title: 'Permission Granted ✅',
        message: `You have been granted a new permission: ${formData.permission_type}`,
        readBy: [],
        created_at: new Date().toISOString()
      });
      localStorage.setItem('sv_notifications', JSON.stringify(allNotifs));

      setFormData({ vendor_id: '', zone_id: '', permission_type: 'Official Street Vending Permit (Class A)', valid_from: new Date().toISOString().split('T')[0], valid_until: '2026-12-31', notes: '' });
      loadPermissions();
      addToast('Official trade permit authenticated and issued.', 'success');
    } catch (err) {
      if (isDemo) {
        const newPerm = {
          id: `perm-demo-${Date.now()}`,
          permission_type: formData.permission_type,
          valid_from: formData.valid_from,
          valid_until: formData.valid_until,
          status: 'active',
          vendor_id: formData.vendor_id,
          profiles: { full_name: vendors.find(v => v.id === formData.vendor_id)?.name || 'Demo Vendor' },
          zones: { name: zones.find(z => z.id === formData.zone_id)?.name || 'Mirpur Commercial Hub' },
          issuer: { full_name: profile?.full_name || 'Tanvir Ahmed' }
        };
        setPermissions(prev => [newPerm, ...prev]);
        addToast('Trade permit issued in demo mode!', 'success');
      } else {
        addToast(err.response?.data?.error || 'Failed to grant permission', 'danger');
      }
    }
  }

  async function handleRevoke(id) {
    confirmAction({
      title: 'Revoke Official Authorization',
      message: 'Are you sure you want to revoke this vendor\'s municipal trading permission?',
      confirmText: 'Yes, Revoke License',
      onConfirm: async () => {
        try {
          const token = await getToken();
          await axios.put(`${import.meta.env.VITE_API_URL}/permissions/${id}`, { status: 'revoked' }, { headers: { Authorization: `Bearer ${token}` } });
          loadPermissions();
          addToast('Permission revoked successfully', 'success');
        } catch {
          if (isDemo) {
            setPermissions(prev => prev.map(p => p.id === id ? { ...p, status: 'revoked' } : p));
            addToast('Permission marked revoked (Demo Mode)', 'success');
          }
        }
      }
    });
  }

  async function handleDownloadLicense(p) {
    try {
      await generateLicensePDF({
        vendorName:     p.profiles?.full_name || 'Rahim Uddin',
        nidNumber:      p.profiles?.nid_number || '1988269012345678',
        phone:          p.profiles?.phone || '+880 1711-234567',
        address:        p.profiles?.home_address || 'Section 10, Mirpur, Dhaka',
        tinNumber:      p.profiles?.tin_number || '5421980341',
        businessName:   p.profiles?.business_name || "Rahim's Tea & Fuchka Corner",
        businessType:   p.profiles?.business_type || 'Street Food & Beverage',
        operatingHours: p.profiles?.operating_hours || '07:00 AM - 10:30 PM',
        avatar_url:     p.profiles?.avatar_url,
        permissionType: p.permission_type,
        zoneName:       p.zones?.name || 'Mirpur Commercial Hub',
        spotNumber:     p.spots?.spot_number || 'M10-04',
        latitude:       p.spots?.latitude || 23.8068,
        longitude:      p.spots?.longitude || 90.3687,
        validFrom:      p.valid_from || '2026-01-01',
        validUntil:     p.valid_until || '2026-12-31',
        licenseId:      p.id,
        issuedBy:       p.issuer?.full_name || 'City Licensing Officer (Tanvir Ahmed)',
        designation:    'Licensing Officer',
      });
    } catch {
      addToast('Failed to generate PDF', 'danger');
    }
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Municipal Header Banner */}
      <div className="sv-card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--sv-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="sv-badge sv-badge-success">
                {isAdmin ? 'MUNICIPAL REGISTRY DESK' : 'MERCHANT PERMIT REGISTER'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
                Dhaka Metropolitan City Corporation
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 2px' }}>
              {isAdmin ? 'Official Trade Authorization & Licensing Register' : 'My Authenticated Trade Licenses'}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--sv-text-secondary)' }}>
              {isAdmin 
                ? 'Issue, monitor, and revoke official municipal street vending licenses and legal authorizations.' 
                : 'Access your authenticated municipal street vending certificates and download legal permit PDFs.'}
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN: ISSUE AUTHORIZATION FORM */}
      {isAdmin && (
        <div className="sv-card">
          <div className="sv-card-header">
            <h5>Issue Official Municipal Authorization</h5>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-3">
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                    Recipient Merchant
                  </label>
                  <select className="form-select" value={formData.vendor_id} onChange={e => handleVendorChange(e.target.value)} required>
                    <option value="">— Select Merchant —</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>

                <div className="col-md-3">
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                    Authorized Zone
                  </label>
                  <select className="form-select" value={formData.zone_id} onChange={e => setFormData({...formData, zone_id: e.target.value})} required>
                    <option value="">— Select Zone —</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>

                <div className="col-md-3">
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                    Permit Class
                  </label>
                  <input type="text" className="form-control" value={formData.permission_type} onChange={e => setFormData({...formData, permission_type: e.target.value})} required />
                </div>

                <div className="col-md-3">
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                    Public Registry Notes
                  </label>
                  <input type="text" className="form-control" placeholder="Observations..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>

                <div className="col-md-3">
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                    Effective Date
                  </label>
                  <input type="date" className="form-control" value={formData.valid_from} onChange={e => setFormData({...formData, valid_from: e.target.value})} />
                </div>

                <div className="col-md-3">
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                    Expiration Date
                  </label>
                  <input type="date" className="form-control" value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} />
                </div>

                <div className="col-md-6 d-flex align-items-end justify-content-end">
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px' }}>
                    Authenticate & Issue Permit 🛡️
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PERMISSIONS REGISTER TABLE */}
      <div className="sv-card">
        <div className="sv-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h5>Authenticated License Ledger</h5>
            <span className="sv-badge sv-badge-info">{permissions.length} CERTIFICATES</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="sv-table">
            <thead>
              <tr>
                {isAdmin && <th>Merchant</th>}
                <th>License Class & Ward</th>
                <th>Status</th>
                <th>Validity Span</th>
                <th style={{ textAlign: 'right' }}>Official Certificate</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {permissions.map(p => {
                const isActive = p.status === 'active';
                return (
                  <tr key={p.id}>
                    {isAdmin && (
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--sv-text-primary)' }}>{p.profiles?.full_name}</div>
                        <div className="sv-mono-data" style={{ fontSize: '11px', color: 'var(--sv-text-muted)' }}>
                          ID: {p.vendor_id?.slice(0, 8)}
                        </div>
                      </td>
                    )}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--sv-text-primary)' }}>{p.permission_type}</div>
                      <div style={{ fontSize: '12px', color: 'var(--sv-primary)', fontWeight: 600 }}>{p.zones?.name || 'Dhaka Metropolitan Area'}</div>
                    </td>
                    <td>
                      <span className={`sv-badge ${isActive ? 'sv-badge-success' : 'sv-badge-danger'}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="sv-mono-data" style={{ fontSize: '11.5px', color: 'var(--sv-text-muted)' }}>
                      {fmtDate(p.valid_from)} → {fmtDate(p.valid_until)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isActive && (
                        <button
                          onClick={() => handleDownloadLicense(p)}
                          className="btn btn-outline-dark btn-sm"
                          style={{ padding: '3px 10px', fontSize: '11.5px' }}
                        >
                          📄 Verified PDF
                        </button>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        {isActive && (
                          <button 
                            onClick={() => handleRevoke(p.id)} 
                            className="btn btn-outline-danger btn-sm"
                            style={{ padding: '3px 10px', fontSize: '11.5px' }}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {permissions.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '36px', color: 'var(--sv-text-muted)' }}>
                    No municipal licenses recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
