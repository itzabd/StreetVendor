import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { generateLicensePDF } from '../utils/LicensePDF';

export default function Permissions() {
  const { addToast } = useToast();
  const { confirmAction } = useConfirm();
  const location = useLocation();
  const [permissions, setPermissions] = useState([]);
  const [zones, setZones] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [approvedApps, setApprovedApps] = useState([]);
  
  const [formData, setFormData] = useState({ vendor_id: '', zone_id: '', permission_type: '', valid_from: new Date().toISOString().split('T')[0], valid_until: '', notes: '' });
  
  const { profile, getToken } = useAuth();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => { 
    loadPermissions(); 
    if (isAdmin) {
      loadZones();
      loadVendors();

      if (location.state) {
        const { vendor_id, zone_id } = location.state;
        if (vendor_id) setFormData(prev => ({ ...prev, vendor_id }));
        if (zone_id) setFormData(prev => ({ ...prev, zone_id }));
        addToast('Form pre-filled from application!', 'info');
      }
    }
  }, [isAdmin, location.state]);

  async function loadPermissions() {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/permissions`, { headers: { Authorization: `Bearer ${token}` } });
    setPermissions(res.data);
  }

  async function loadZones() {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
    setZones(res.data);
  }

  async function loadVendors() {
    const token = await getToken();
    // For permissions, we might grant it to any assignment or vendor. Load all apps for now to get vendors.
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/applications`, { headers: { Authorization: `Bearer ${token}` } });
    const mapped = res.data.map(a => ({ id: a.vendor_id, name: a.profiles?.full_name }));
    const unique = Array.from(new Map(mapped.map(item => [item.id, item])).values());
    setVendors(unique);
    setApprovedApps(res.data.filter(a => a.status === 'approved'));
  }

  const handleVendorChange = (vendorId) => {
    setFormData(prev => ({ ...prev, vendor_id: vendorId }));
    if (!vendorId) return;

    const app = approvedApps.find(a => a.vendor_id === vendorId);
    if (app && app.zone_id) {
      setFormData(prev => ({ ...prev, zone_id: app.zone_id }));
      addToast(`Found application for ${app.zones?.name}. Auto-filled zone.`, 'info');
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/permissions`, formData, { headers: { Authorization: `Bearer ${token}` } });
      
      // Issue targeted notification
      const allNotifs = JSON.parse(localStorage.getItem('sv_notifications') || '[]');
      allNotifs.unshift({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        target_vendor_id: formData.vendor_id,
        title: 'Permission Granted ✅',
        message: `You have been granted a new permission: ${formData.permission_type}`,
        readBy: [],
        created_at: new Date().toISOString()
      });
      localStorage.setItem('sv_notifications', JSON.stringify(allNotifs));

      setFormData({ vendor_id: '', zone_id: '', permission_type: '', valid_from: new Date().toISOString().split('T')[0], valid_until: '', notes: '' });
      loadPermissions();
      addToast('Permission granted', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to grant permission', 'danger');
    }
  }

  async function handleRevoke(id) {
    confirmAction({
      title: 'Revoke Permission',
      message: 'Are you sure you want to revoke this vendor\'s permission?',
      confirmText: 'Yes, Revoke',
      onConfirm: async () => {
        try {
          const token = await getToken();
          await axios.put(`${import.meta.env.VITE_API_URL}/permissions/${id}`, { status: 'revoked' }, { headers: { Authorization: `Bearer ${token}` } });
          loadPermissions();
          addToast('Permission revoked successfully', 'success');
        } catch (err) {
          addToast(err.response?.data?.error || 'Failed to revoke permission', 'danger');
        }
      }
    });
  }

  const getStatusBadge = (status) => {
    const colors = { active: 'success', expired: 'warning', revoked: 'danger' };
    return <span className={`badge bg-${colors[status]}`}>{status}</span>;
  };

  async function handleDownloadLicense(p) {
    try {
      await generateLicensePDF({
        vendorName:     p.profiles?.full_name,
        nidNumber:      p.profiles?.nid_number || 'N/A',
        phone:          p.profiles?.phone,
        address:        p.profiles?.home_address || 'N/A',
        tinNumber:      p.profiles?.tin_number || 'N/A',
        businessName:   p.profiles?.business_name,
        businessType:   p.profiles?.business_type,
        operatingHours: p.profiles?.operating_hours,
        avatar_url:     p.profiles?.avatar_url,
        permissionType: p.permission_type,
        zoneName:       p.zones?.name,
        spotNumber:     p.spots?.spot_number || 'N/A',
        latitude:       p.spots?.latitude,
        longitude:      p.spots?.longitude,
        validFrom:      p.valid_from,
        validUntil:     p.valid_until,
        licenseId:      p.id,
        issuedBy:       p.issuer?.full_name || 'City Corporation Office',
        designation:    'Licensing Officer',
      });
    } catch (err) {
      addToast('Failed to generate PDF', 'danger');
    }
  }

  return (
    <div className="permissions-page-container animate-entrance">
      <div className="sv-page-header mb-5">
        <h2 className="fw-900 mb-1" style={{ fontSize: '2.2rem', letterSpacing: '-0.02em' }}>
          {isAdmin ? 'Permission Registry' : 'My Legal Permits'}
        </h2>
        <p className="text-muted fw-500">
          {isAdmin ? 'Oversee and issue official vending authorizations for the territory.' : 'Your official authorizations and digital license records.'}
        </p>
      </div>
      
      {isAdmin && (
        <div className="modern-glass-card mb-5">
          <div className="card-header-premium">
            <div className="d-flex align-items-center gap-2">
              <span className="card-dot"></span>
              <h5 className="mb-0 fw-800">Issue New Authorization</h5>
            </div>
          </div>
          <div className="p-4">
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-3">
                <div className="form-group-modern">
                  <label>Recipient Vendor</label>
                  <select value={formData.vendor_id} onChange={e => handleVendorChange(e.target.value)} required>
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group-modern">
                  <label>Assigned Zone</label>
                  <select value={formData.zone_id} onChange={e => setFormData({...formData, zone_id: e.target.value})} required>
                    <option value="">-- Select Zone --</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group-modern">
                  <label>Permission Type</label>
                  <input type="text" placeholder="e.g. Seasonal, Night" value={formData.permission_type} onChange={e => setFormData({...formData, permission_type: e.target.value})} required />
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group-modern">
                  <label>Public Notes</label>
                  <input type="text" placeholder="Observations..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
              </div>
              
              <div className="col-md-3">
                <div className="form-group-modern">
                  <label>Validity Start</label>
                  <input type="date" value={formData.valid_from} onChange={e => setFormData({...formData, valid_from: e.target.value})} />
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group-modern">
                  <label>Validity Expiry</label>
                  <input type="date" value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} />
                </div>
              </div>
              <div className="col-md-6 d-flex align-items-end justify-content-end">
                <button type="submit" className="btn-premium-action">Authorize & Push to Cloud 🛡️</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="modern-glass-card">
        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                {isAdmin && <th>Merchant</th>}
                <th>Authorization & Zone</th>
                <th>Status</th>
                <th>Period</th>
                <th className="text-end">Official Record</th>
                {isAdmin && <th className="text-end">Registry Action</th>}
              </tr>
            </thead>
            <tbody>
              {permissions.map(p => (
                <tr key={p.id}>
                  {isAdmin && (
                    <td>
                      <div className="merchant-info">
                        <div className="fw-700 text-dark">{p.profiles?.full_name}</div>
                        <div className="small text-muted" style={{ fontSize: 10 }}>UID: {p.vendor_id?.slice(0, 8)}</div>
                      </div>
                    </td>
                  )}
                  <td>
                    <div className="permit-type fw-800 text-dark">{p.permission_type}</div>
                    <div className="zone-ref small fw-600 text-primary">{p.zones?.name}</div>
                  </td>
                  <td>
                    <span className={`status-pill-mini ${p.status}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="small text-muted fw-600">
                    {p.valid_from ? new Date(p.valid_from).toLocaleDateString() : 'Immediate'} <br/> 
                    <span className="opacity-50">to</span> <br/> 
                    {p.valid_until ? new Date(p.valid_until).toLocaleDateString() : 'Permanent'}
                  </td>
                  <td className="text-end">
                    {p.status === 'active' && (
                      <button
                        onClick={() => handleDownloadLicense(p)}
                        className="btn-download-mini"
                        title="Download Verified PDF"
                      >
                        📄 Download
                      </button>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="text-end">
                      {p.status === 'active' && (
                        <button onClick={() => handleRevoke(p.id)} className="btn-revoke-mini">Revoke</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {permissions.length === 0 && <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-5 text-muted">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .permissions-page-container { padding: 40px; max-width: 1240px; margin: 0 auto; background: #fdfdfd; min-height: 100vh; }
        .modern-glass-card { background: #fff; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #edf2f7; overflow: hidden; }
        
        .card-header-premium { padding: 20px 24px; border-bottom: 1px solid #f8fafc; }
        .card-dot { width: 8px; height: 8px; background: #1a6b3c; border-radius: 2px; }

        .form-group-modern { display: flex; flex-direction: column; gap: 4px; }
        .form-group-modern label { font-size: 11px; font-weight: 800; color: #1a6b3c; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-group-modern input, .form-group-modern select { padding: 10px 14px; border-radius: 10px; border: 1.5px solid #edf2f7; font-size: 13px; font-weight: 600; color: #1e293b; background: #fcfdfd; transition: 0.2s; }
        .form-group-modern input:focus { outline: none; border-color: #1a6b3c; box-shadow: 0 0 0 3px rgba(26, 107, 60, 0.05); }

        .btn-premium-action { background: #1a6b3c; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 800; font-size: 13px; transition: 0.2s; }
        .btn-premium-action:hover { background: #155730; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(26, 107, 60, 0.2); }

        .modern-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .modern-table th { background: #fcfdfe; padding: 16px 24px; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #edf2f7; }
        .modern-table td { padding: 16px 24px; vertical-align: middle; border-bottom: 1px solid #fcfdfe; }
        
        .status-pill-mini { padding: 4px 10px; border-radius: 6px; font-size: 9px; font-weight: 800; }
        .status-pill-mini.active { background: #dcfce7; color: #166534; }
        .status-pill-mini.expired { background: #fef9c3; color: #854d0e; }
        .status-pill-mini.revoked { background: #fee2e2; color: #991b1b; }

        .btn-download-mini { background: #f0fdf4; color: #1a6b3c; border: 1.5px solid #dcfce7; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 700; transition: 0.2s; }
        .btn-download-mini:hover { background: #1a6b3c; color: #fff; }

        .btn-revoke-mini { background: #fff; color: #ef4444; border: 1.5px solid #fee2e2; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-revoke-mini:hover { background: #ef4444; color: #fff; border-color: #ef4444; }

        @keyframes svIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-entrance { animation: svIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}
