import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import ZoneMap from '../components/ZoneMap';
import supabase from '../supabaseClient';

// ── Helpers ────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

const parsePreferredSpot = (notes) => {
  if (!notes) return null;
  const m = notes.match(/\[Preferred Spot:\s*([^\]]+)\]/);
  return m ? m[1].trim() : null;
};
const cleanNotes = (notes) => {
  if (!notes) return '';
  return notes.replace(/\[Preferred Spot:[^\]]+\]/g, '').replace(/\[Claiming Guest Spot:[^\]]+\]/g, '').trim();
};

export default function Applications() {
  const { addToast } = useToast();
  const { confirmAction } = useConfirm();
  const [apps, setApps] = useState([]);
  const [zones, setZones] = useState([]);
  const [zonesLoaded, setZonesLoaded] = useState(false);
  const [zoneSpots, setZoneSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);

  const [formData, setFormData] = useState({
    zone_id: '',
    notes: '',
    requested_from: new Date().toISOString().split('T')[0],
    requested_until: ''
  });

  const [selectedZoneForMap, setSelectedZoneForMap] = useState(null);
  const [allGuestSpots, setAllGuestSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');

  // Admin workspace
  const [workspaceApp, setWorkspaceApp] = useState(null);
  const [drawerZones, setDrawerZones] = useState([]);
  const [drawerSpots, setDrawerSpots] = useState([]);
  const [drawerSelZone, setDrawerSelZone] = useState('');
  const [approvalForm, setApprovalForm] = useState({
    spot_id: '', start_date: '', end_date: '',
    rent_amount: '', permission_type: 'General Vending', admin_notes: ''
  });
  const [drawerLoading, setDrawerLoading] = useState(false);

  const { profile, getToken } = useAuth();
  const isAdmin = profile?.role === 'admin';

  // Stable spot marker array
  const vendorSpotMarkers = useMemo(
    () => [...zoneSpots, ...allGuestSpots],
    [zoneSpots, allGuestSpots]
  );

  useEffect(() => {
    loadApps();
    if (!isAdmin) { loadZones(); loadAllGuestSpots(); }
    if (isAdmin) { loadDrawerZones(); }
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (drawerSelZone) loadDrawerSpots(drawerSelZone);
    else setDrawerSpots([]);
  }, [drawerSelZone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (workspaceApp) {
      setDrawerSelZone(workspaceApp.zone_id || '');
      setApprovalForm(prev => ({
        ...prev,
        start_date: workspaceApp.requested_from || new Date().toISOString().split('T')[0],
        end_date: workspaceApp.requested_until || ''
      }));
    }
  }, [workspaceApp]);

  async function loadDrawerZones() {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
    setDrawerZones(res.data);
  }

  async function loadDrawerSpots(zoneId) {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/spots?zone_id=${zoneId}`, { headers: { Authorization: `Bearer ${token}` } });
    setDrawerSpots(res.data.filter(s => s.status === 'available'));
  }

  async function loadAllGuestSpots() {
    try {
      const { data } = await supabase.from('guest_reports').select('*').eq('status', 'approved');
      setAllGuestSpots((data || []).map(r => ({
        id: r.id, is_guest_report: true,
        latitude: r.latitude, longitude: r.longitude,
        label: r.vendor_name, vendor_name: r.vendor_name, status: 'unverified'
      })));
    } catch (e) { console.error(e); }
  }

  async function loadApps() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/applications`, { headers: { Authorization: `Bearer ${token}` } });
      setApps(res.data);
    } catch (err) { console.error('loadApps error:', err); }
  }

  async function loadZones() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
      setZones(res.data);
    } finally {
      setZonesLoaded(true);
    }
  }

  function handleZoneSelect(zoneId) {
    setFormData(f => ({ ...f, zone_id: zoneId }));
    setSelectedSpot(null);
    if (!zoneId) {
      setSelectedZoneForMap(null);
      setZoneSpots([]);
      return;
    }
    const zone = zones.find(z => z.id === zoneId);
    if (zone) {
      const parsed = { ...zone };
      if (parsed.boundary_geojson && typeof parsed.boundary_geojson === 'string') {
        try { parsed.boundary_geojson = JSON.parse(parsed.boundary_geojson); } catch(e) {}
      }
      setSelectedZoneForMap(parsed);
      loadZoneSpots(zoneId);
    } else {
      setSelectedZoneForMap(null);
      setZoneSpots([]);
    }
  }

  async function loadZoneSpots(zoneId) {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/spots?zone_id=${zoneId}`, { headers: { Authorization: `Bearer ${token}` } });
      setZoneSpots(res.data.filter(s => s.latitude && s.longitude));
    } catch (e) { console.error(e); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.zone_id) return addToast('Please select a zone before submitting.', 'warning');
    setLoading(true);
    try {
      const token = await getToken();
      let spotNote = '';
      if (selectedSpot) {
        spotNote = selectedSpot.is_guest_report
          ? `[Claiming Guest Spot: ${selectedSpot.vendor_name || 'Spot'}] `
          : `[Preferred Spot: ${selectedSpot.spot_number}] `;
      }
      await axios.post(`${import.meta.env.VITE_API_URL}/applications`, {
        zone_id: formData.zone_id,
        notes: spotNote + formData.notes,
        requested_from: formData.requested_from || null,
        requested_until: formData.requested_until || null
      }, { headers: { Authorization: `Bearer ${token}` } });

      setFormData({ zone_id: '', notes: '', requested_from: new Date().toISOString().split('T')[0], requested_until: '' });
      setSelectedZoneForMap(null);
      setZoneSpots([]);
      setSelectedSpot(null);
      loadApps();
      addToast('Application submitted successfully!', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to submit application', 'danger');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnifiedApprove() {
    if (!approvalForm.spot_id || !approvalForm.rent_amount) return addToast('Please select a spot and enter rent amount', 'warning');
    setDrawerLoading(true);
    try {
      const token = await getToken();
      await axios.put(`${import.meta.env.VITE_API_URL}/applications/${workspaceApp.id}`, { status: 'approved' }, { headers: { Authorization: `Bearer ${token}` } });
      await axios.post(`${import.meta.env.VITE_API_URL}/assignments`, {
        vendor_id: workspaceApp.vendor_id,
        spot_id: approvalForm.spot_id,
        start_date: approvalForm.start_date,
        end_date: approvalForm.end_date,
        rent_amount: approvalForm.rent_amount
      }, { headers: { Authorization: `Bearer ${token}` } });
      await axios.post(`${import.meta.env.VITE_API_URL}/permissions`, {
        vendor_id: workspaceApp.vendor_id,
        zone_id: drawerSelZone,
        spot_id: approvalForm.spot_id, // Link to physical spot
        permission_type: approvalForm.permission_type,
        valid_from: approvalForm.start_date,
        valid_until: approvalForm.end_date,
        notes: approvalForm.admin_notes
      }, { headers: { Authorization: `Bearer ${token}` } });
      pushNotif(workspaceApp.vendor_id, 'Approved & Licensed! 📜', 'Your application is approved. Spot assigned and license issued.');
      addToast('Application approved, spot assigned, and license issued!', 'success');
      setWorkspaceApp(null);
      loadApps();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to process approval', 'danger');
    } finally {
      setDrawerLoading(false);
    }
  }

  async function handleReject(appId, vendorId, zoneName) {
    confirmAction({
      title: 'Reject Application',
      message: 'Are you sure you want to reject this application?',
      confirmText: 'Yes, Reject',
      onConfirm: async () => {
        const token = await getToken();
        await axios.put(`${import.meta.env.VITE_API_URL}/applications/${appId}`, { status: 'rejected' }, { headers: { Authorization: `Bearer ${token}` } });
        pushNotif(vendorId, 'Application Rejected ❌', `Your application for ${zoneName || 'a zone'} was rejected.`);
        addToast('Application rejected', 'success');
        setWorkspaceApp(null);
        loadApps();
      }
    });
  }

  function pushNotif(vendorId, title, message) {
    const all = JSON.parse(localStorage.getItem('sv_notifications') || '[]');
    all.unshift({ id: Date.now().toString(), target_vendor_id: vendorId, title, message, readBy: [], created_at: new Date().toISOString() });
    localStorage.setItem('sv_notifications', JSON.stringify(all));
  }

  const counts = { pending: 0, approved: 0, rejected: 0 };
  apps.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
  const filtered = apps.filter(a => filter === 'all' ? true : a.status === filter);
  const statusColors = { pending: ['#fef9c3', '#854d0e'], approved: ['#dcfce7', '#166534'], rejected: ['#fee2e2', '#991b1b'] };

  return (
    <>
      <div className="animate-entrance" style={{ position: 'relative' }}>
        <div className="sv-page-header">
          <h3>{isAdmin ? '📋 Vendor Management' : '📝 My Applications'}</h3>
          <p>{isAdmin ? 'Consolidated command center for vendor verification and licensing.' : 'Apply for a spot and track your application status'}</p>
        </div>

        {!isAdmin && (
          <div className="sv-form-card mb-4" style={{ borderRadius: 20, padding: '24px 30px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-800 mb-0" style={{ color: '#1a6b3c' }}>Apply for a Vending Spot</h5>
              <span className="badge bg-light text-success border px-3 py-2" style={{ fontSize: 11 }}>Step 1: Select Zone & Spot</span>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* LEFT: FORM FIELDS */}
                <div className="col-lg-4">
                  <div className="row g-2">
                    <div className="col-12">
                      <label className="form-label small fw-bold mb-1">Select Zone <span className="text-danger">*</span></label>
                      <select className="form-select form-select-sm border-light bg-light" value={formData.zone_id} onChange={e => handleZoneSelect(e.target.value)} required>
                        <option value="">-- Choose --</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold mb-1">Requested From</label>
                      <input type="date" className="form-control form-control-sm border-light bg-light" value={formData.requested_from} onChange={e => setFormData({ ...formData, requested_from: e.target.value })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold mb-1">Requested Until</label>
                      <input type="date" className="form-control form-control-sm border-light bg-light" value={formData.requested_until} onChange={e => setFormData({ ...formData, requested_until: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold mb-1">Business Notes</label>
                      <textarea rows={2} style={{ fontSize: 13 }} placeholder="Tell us what you sell..." className="form-control border-light bg-light" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                    <div className="col-12 mt-3">
                      <button type="submit" className="btn btn-primary w-100 fw-900 py-2 shadow-sm" style={{ borderRadius: 12 }} disabled={loading || !formData.zone_id}>
                        {loading ? 'Submitting...' : '🚀 Submit Application'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT: MAP SELECTOR */}
                <div className="col-lg-8">
                  {zonesLoaded && (
                    <div className="h-100">
                      {formData.zone_id && selectedZoneForMap ? (
                        <div className="h-100 d-flex flex-column">
                          <ZoneMap
                            key={`zone-map-${formData.zone_id}`}
                            zones={[selectedZoneForMap]}
                            spotMarkers={vendorSpotMarkers}
                            onSpotSelect={setSelectedSpot}
                            selectedSpotId={selectedSpot?.id || null}
                            viewOnly
                            height="260px"
                            center={selectedZoneForMap.boundary_geojson?.[0] || [23.8103, 90.4125]}
                          />
                          {selectedSpot && (
                            <div className="mt-2 p-2 rounded-3 d-flex align-items-center justify-content-between" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                              <span className="small fw-bold text-success" style={{ fontSize: 11 }}>✅ Selected: {selectedSpot.is_guest_report ? selectedSpot.vendor_name : `Spot #${selectedSpot.spot_number}`}</span>
                              <button type="button" className="btn btn-sm btn-link text-muted p-0 text-decoration-none" onClick={() => setSelectedSpot(null)}>✕ Clear</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 rounded-4" style={{ background: '#f8fafc', border: '1px dashed #e2e8f0', color: '#94a3b8', minHeight: 260 }}>
                          <div className="text-center">
                            <div style={{ fontSize: 24 }}>🗺️</div>
                            <div className="small fw-semibold mt-1">Select a zone to pick a spot</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {isAdmin && (
          <div className="row g-3 mb-4">
            {[
              { key: 'pending', label: 'New Queue', icon: '⏳', bg: '#fef9c3', col: '#854d0e', border: '#fde047' },
              { key: 'approved', label: 'Active Permitees', icon: '✅', bg: '#dcfce7', col: '#166534', border: '#86efac' },
              { key: 'rejected', label: 'Rejected', icon: '❌', bg: '#fee2e2', col: '#991b1b', border: '#fca5a5' },
            ].map(s => (
              <div key={s.key} className="col-md-4">
                <div className="sv-hover-lift" onClick={() => setFilter(s.key)} style={{ background: filter === s.key ? s.bg : '#fff', border: `1.5px solid ${filter === s.key ? s.border : '#e2e8f0'}`, borderRadius: 16, padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: 32 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: s.col, lineHeight: 1 }}>{counts[s.key]}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="sv-card border-0 shadow-sm" style={{ borderRadius: 28 }}>
          <div className="sv-card-header bg-white border-0 py-4 px-4">
            <h5 className="fw-800 mb-0">{isAdmin ? 'Application Registry' : 'My Application History'}</h5>
          </div>
          <div className="px-4 pb-4">
            {filtered.length === 0 && (
              <div className="text-center py-5 text-muted">
                <div style={{ fontSize: 40 }}>📋</div>
                <div className="fw-semibold mt-2">{isAdmin ? 'No applications in this category.' : 'You have not submitted any applications yet.'}</div>
              </div>
            )}
            {filtered.map(a => {
              const preferredSpot = parsePreferredSpot(a.notes);
              return (
                <div key={a.id} className="sv-hover-lift" style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 20, padding: '20px', marginBottom: 12 }}>
                  <div className="d-flex align-items-center gap-4">
                    <div style={{ width: 50, height: 50, borderRadius: '16px', background: 'linear-gradient(135deg, #1a6b3c, #1e293b)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                      {initials(a.profiles?.full_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="fw-800 fs-6 mb-0" style={{ color: '#1e293b' }}>{a.profiles?.full_name || 'Unknown Vendor'}</div>
                      <div className="small text-muted fw-semibold">🏪 {a.profiles?.business_name || 'Individual Vendor'} • {fmtDate(a.created_at)}</div>
                      <div className="mt-1">
                        {a.zones?.name && <span className="sv-badge sv-badge-primary me-2 px-3">🏙️ {a.zones.name}</span>}
                        {preferredSpot && <span className="sv-badge bg-warning text-dark me-2 px-3">📍 Prefers {preferredSpot}</span>}
                      </div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <span style={{ background: statusColors[a.status]?.[0], color: statusColors[a.status]?.[1], borderRadius: 12, padding: '6px 16px', fontSize: 12, fontWeight: 800 }}>{a.status.toUpperCase()}</span>
                      {(a.requested_from || a.requested_until) && (
                        <div className="small text-muted mt-2 fw-semibold">📅 {fmtDate(a.requested_from)} – {a.requested_until ? fmtDate(a.requested_until) : 'Renewable'}</div>
                      )}
                    </div>
                    {isAdmin && a.status === 'pending' && (
                      <button onClick={() => setWorkspaceApp(a)} className="btn btn-dark btn-sm px-4 fw-800 shadow-sm ms-2 flex-shrink-0" style={{ borderRadius: 12, padding: '10px 20px' }}>Open Review</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <style>{`
          .fw-800 { font-weight: 800; }
          .fw-900 { font-weight: 900; }
          @keyframes svIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
          .animate-entrance { animation: svIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}</style>
      </div>

      {workspaceApp && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 30, 20, 0.85)', backdropFilter: 'blur(10px)' }} onClick={() => setWorkspaceApp(null)} />
          <div className="animate-entrance" style={{ position: 'relative', width: '100%', maxWidth: 1150, height: '90vh', background: '#fff', borderRadius: 32, overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>

            <div style={{ background: 'linear-gradient(135deg, #1a6b3c, #1e293b)', padding: '24px 40px', color: '#fff', position: 'relative', flexShrink: 0 }}>
              <button 
                onClick={() => setWorkspaceApp(null)} 
                className="btn-close btn-close-white position-absolute" 
                style={{ top: 24, right: 30, opacity: 0.8, filter: 'invert(1) grayscale(100%) brightness(200%)' }} 
              />
              <div className="d-flex align-items-center gap-4">
                <img
                  src={workspaceApp.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(workspaceApp.profiles?.full_name || 'V')}&background=2d8f55&color=fff`}
                  style={{ width: 80, height: 80, borderRadius: 24, objectFit: 'cover', border: '3px solid rgba(255,255,255,0.25)', flexShrink: 0 }}
                />
                <div>
                  <h3 className="fw-900 mb-1">{workspaceApp.profiles?.full_name}</h3>
                  <div className="opacity-75 small">📞 {workspaceApp.profiles?.phone || 'No phone on file'}</div>
                  <div className="mt-2 d-flex gap-2">
                    <span className="badge bg-white text-dark px-2 py-1" style={{ fontSize: 10 }}>#{workspaceApp.id.slice(0, 8).toUpperCase()}</span>
                    <span className="badge bg-primary px-2 py-1" style={{ fontSize: 10 }}>📅 {fmtDate(workspaceApp.created_at)}</span>
                    {workspaceApp.zones?.name && <span className="badge bg-success px-2 py-1" style={{ fontSize: 10 }}>🏙️ {workspaceApp.zones.name}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 40px' }}>
              <div className="row g-3">
                {/* LEFT: DOSSIER */}
                <div className="col-lg-6">
                  <div className="p-4 rounded-4 h-100" style={{ background: '#f8fafc', border: '1.5px dashed #e2e8f0' }}>
                    <h6 className="fw-800 mb-4 d-flex align-items-center gap-2"><span>🛡️</span> Legal & Identity Dossier</h6>
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="small text-muted fw-700 text-uppercase mb-1" style={{ fontSize: 10 }}>NID / Smart Card</div>
                        <div className="fw-800 small" style={{ color: workspaceApp.profiles?.nid_number ? '#1e293b' : '#94a3b8' }}>{workspaceApp.profiles?.nid_number || 'Not Provided'}</div>
                      </div>
                      <div className="col-6">
                        <div className="small text-muted fw-700 text-uppercase mb-1" style={{ fontSize: 10 }}>TIN (Tax ID)</div>
                        <div className="fw-800 small" style={{ color: workspaceApp.profiles?.tin_number ? '#1e293b' : '#94a3b8' }}>{workspaceApp.profiles?.tin_number || 'Not Provided'}</div>
                      </div>
                      <div className="col-12 pt-1 border-top">
                        <div className="small text-muted fw-700 text-uppercase mb-1 mt-2" style={{ fontSize: 10 }}>Home Residence</div>
                        <div className="fw-700 small" style={{ color: workspaceApp.profiles?.home_address ? '#1e293b' : '#94a3b8' }}>{workspaceApp.profiles?.home_address || 'Not Provided'}</div>
                      </div>
                      <div className="col-6 pt-1 border-top">
                        <div className="small text-muted fw-700 text-uppercase mb-1 mt-2" style={{ fontSize: 10 }}>Business Name</div>
                        <div className="fw-700 small">{workspaceApp.profiles?.business_name || 'Individual Stall'}</div>
                      </div>
                      <div className="col-6 pt-1 border-top">
                        <div className="small text-muted fw-700 text-uppercase mb-1 mt-2" style={{ fontSize: 10 }}>Operating Hours</div>
                        <div className="fw-700 small">{workspaceApp.profiles?.operating_hours || 'Not Set'}</div>
                      </div>
                      
                      <div className="col-12 pt-1 border-top">
                        <div className="d-flex justify-content-between align-items-start mt-2">
                          <div>
                            <div className="small text-muted fw-700 text-uppercase mb-1" style={{ fontSize: 10 }}>Requested Duration</div>
                            <div className="fw-700 small text-primary">{fmtDate(workspaceApp.requested_from)} → {workspaceApp.requested_until ? fmtDate(workspaceApp.requested_until) : 'End of Year'}</div>
                          </div>
                          <div className="text-end">
                            <div className="small text-muted fw-700 text-uppercase mb-1" style={{ fontSize: 10 }}>Requested Spot</div>
                            <div className="fw-800 small text-warning">{parsePreferredSpot(workspaceApp.notes) || 'Any Available'}</div>
                          </div>
                        </div>
                      </div>

                      {cleanNotes(workspaceApp.notes) && (
                        <div className="col-12 pt-1 border-top">
                          <div className="small text-muted fw-700 text-uppercase mb-1 mt-2" style={{ fontSize: 10 }}>Vendor Statement</div>
                          <div className="p-3 bg-white rounded-3 border small fst-italic" style={{ color: '#475569', fontSize: 12 }}>
                            "{cleanNotes(workspaceApp.notes)}"
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT: APPROVAL FORM */}
                <div className="col-lg-6">
                  <div className="p-4 rounded-4" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
                    <h6 className="fw-800 mb-3 d-flex align-items-center gap-2" style={{ color: '#166534' }}>
                      <span>🚀</span> Issue License & Assign Spot
                    </h6>

                    <div className="row g-3">
                      <div className="col-12 mb-2">
                        <label className="form-label small fw-bold mb-1" style={{ fontSize: 12 }}>Select Vending Zone</label>
                        <select className="form-select border-0 shadow-sm py-2" style={{ borderRadius: 10 }} value={drawerSelZone} onChange={e => setDrawerSelZone(e.target.value)}>
                          <option value="">— Choose a Zone —</option>
                          {drawerZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                        </select>
                      </div>

                      <div className="col-12 mb-2">
                        <label className="form-label small fw-bold mb-1" style={{ fontSize: 12 }}>Select Available Spot</label>
                        <div style={{ maxHeight: 120, overflowY: 'auto', padding: 10, background: '#fff', borderRadius: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {drawerSpots.length > 0 ? drawerSpots.map(s => (
                            <div key={s.id} onClick={() => setApprovalForm({ ...approvalForm, spot_id: s.id })}
                              style={{ padding: '8px 16px', borderRadius: 10, border: `2px solid ${approvalForm.spot_id === s.id ? '#1a6b3c' : '#e2e8f0'}`, background: approvalForm.spot_id === s.id ? '#1a6b3c' : '#fff', color: approvalForm.spot_id === s.id ? '#fff' : '#475569', cursor: 'pointer', fontWeight: 800, fontSize: 12 }}>
                              #{s.spot_number}
                            </div>
                          )) : (
                            <div className="w-100 text-center text-muted small py-3" style={{ fontSize: 12 }}>
                              {drawerSelZone ? 'No available spots in this zone.' : 'Select a zone first.'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-6">
                        <label className="form-label small fw-bold mb-1" style={{ fontSize: 12 }}>Monthly Rent (৳)</label>
                        <input type="number" className="form-control border-0 shadow-sm py-2" style={{ borderRadius: 10 }} value={approvalForm.rent_amount} onChange={e => setApprovalForm({ ...approvalForm, rent_amount: e.target.value })} placeholder="e.g. 5000" />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-bold mb-1" style={{ fontSize: 12 }}>Permission Type</label>
                        <input type="text" className="form-control border-0 shadow-sm py-2" style={{ borderRadius: 10 }} value={approvalForm.permission_type} onChange={e => setApprovalForm({ ...approvalForm, permission_type: e.target.value })} />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-bold mb-1" style={{ fontSize: 12 }}>License Start</label>
                        <input type="date" className="form-control border-0 shadow-sm py-2" style={{ borderRadius: 10 }} value={approvalForm.start_date} onChange={e => setApprovalForm({ ...approvalForm, start_date: e.target.value })} />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-bold mb-1" style={{ fontSize: 12 }}>License Expiry</label>
                        <input type="date" className="form-control border-0 shadow-sm py-2" style={{ borderRadius: 10 }} value={approvalForm.end_date} onChange={e => setApprovalForm({ ...approvalForm, end_date: e.target.value })} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <button onClick={handleUnifiedApprove} disabled={drawerLoading || !approvalForm.spot_id || !approvalForm.rent_amount}
                        className="btn w-100 py-3 mb-3 fw-900 shadow-lg text-white"
                        style={{ background: '#1a6b3c', borderRadius: 16, fontSize: 17 }}>
                        {drawerLoading ? '⚡ PROCESSING...' : '🌟 APPROVE & ISSUE LICENSE'}
                      </button>

                      <button onClick={() => handleReject(workspaceApp.id, workspaceApp.vendor_id, workspaceApp.zones?.name)}
                        className="btn btn-link w-100 text-danger fw-bold text-decoration-none" style={{ fontSize: 13 }}>
                        Reject this application
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
