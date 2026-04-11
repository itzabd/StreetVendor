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
    <div className="animate-entrance">
      <h3 className="fw-bold mb-4">{isAdmin ? 'Vendor Permissions' : 'My Permissions'}</h3>
      
      {isAdmin && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title text-primary">Grant New Permission</h5>
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-3">
                <select className="form-select" value={formData.vendor_id} onChange={e => handleVendorChange(e.target.value)} required>
                  <option value="">-- Vendor --</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <select className="form-select" value={formData.zone_id} onChange={e => setFormData({...formData, zone_id: e.target.value})} required>
                  <option value="">-- Zone --</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <input type="text" placeholder="Type (e.g. Seasonal, Night Mkt)" className="form-control" value={formData.permission_type} onChange={e => setFormData({...formData, permission_type: e.target.value})} required />
              </div>
              <div className="col-md-3">
                <input type="text" placeholder="Notes" className="form-control" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              
              <div className="col-md-3">
                <label className="form-label small mb-0">Valid From</label>
                <input type="date" className="form-control" value={formData.valid_from} onChange={e => setFormData({...formData, valid_from: e.target.value})} />
              </div>
              <div className="col-md-3">
                <label className="form-label small mb-0">Valid Until</label>
                <input type="date" className="form-control" value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} />
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button type="submit" className="btn btn-primary w-100">Grant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-responsive bg-white rounded shadow-sm">
        <table className="table gap-2 mb-0 table-hover align-middle">
          <thead className="table-light">
            <tr>
              {isAdmin && <th>Vendor</th>}
              <th>Zone & Type</th>
              <th>Status</th>
              <th>Validity</th>
              <th>Notes</th>
              <th className="text-end">License</th>
              {isAdmin && <th className="text-end">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {permissions.map(p => (
              <tr key={p.id}>
                {isAdmin && <td className="fw-semibold">{p.profiles?.full_name}</td>}
                <td>
                  <div className="fw-bold">{p.permission_type}</div>
                  <div className="small text-muted">{p.zones?.name}</div>
                </td>
                <td>{getStatusBadge(p.status)}</td>
                <td className="small">
                  {p.valid_from || '?'} <br/> to <br/> {p.valid_until || 'Ongoing'}
                </td>
                <td className="small text-muted">{p.notes || '-'}</td>
                <td className="text-end">
                  {p.status === 'active' && (
                    <button
                      onClick={() => handleDownloadLicense(p)}
                      className="btn btn-sm"
                      title="Download Official License PDF"
                      style={{ background: 'linear-gradient(135deg, #1a6b3c, #2d8f55)', color: '#fff', borderRadius: 8, fontSize: 11, fontWeight: 600, border: 'none', whiteSpace: 'nowrap' }}
                    >
                      📄 License
                    </button>
                  )}
                </td>
                {isAdmin && (
                  <td className="text-end">
                    {p.status === 'active' && (
                      <button onClick={() => handleRevoke(p.id)} className="btn btn-sm btn-outline-danger">Revoke</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {permissions.length === 0 && <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-4 text-muted">No permissions found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
