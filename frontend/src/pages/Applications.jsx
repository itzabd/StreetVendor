import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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
    rent_amount: '', permission_type: 'Official Street Vending Permit (Class A)', admin_notes: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [drawerLoading, setDrawerLoading] = useState(false);

  const { profile, getToken, isDemo } = useAuth();
  const isAdmin = profile?.role === 'admin';

  // Fallback demo applications
  const fallbackDemoApps = useMemo(() => [
    {
      id: 'app-demo-01',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      requested_from: '2026-01-01',
      requested_until: '2026-12-31',
      notes: '[Preferred Spot: M10-04] Seeking designated trade allocation for traditional tea & street snacks corner in Mirpur-10 round-about.',
      status: 'pending',
      vendor_id: 'vendor-demo-01',
      zone_id: 'zone-01',
      profiles: {
        full_name: 'Rahim Uddin',
        business_name: "Rahim's Tea & Fuchka Corner",
        phone: '+880 1711-234567',
        nid_number: '1988269012345678',
        tin_number: '5421980341',
        home_address: 'Section 10, Mirpur, Dhaka-1216',
        operating_hours: '07:00 AM - 10:30 PM'
      },
      zones: { id: 'zone-01', name: 'Mirpur Commercial Hub' }
    },
    {
      id: 'app-demo-02',
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      requested_from: '2026-02-01',
      requested_until: '2026-12-31',
      notes: '[Preferred Spot: KB-01] Daily seasonal fruit & green produce cart requiring morning trade clearance.',
      status: 'pending',
      vendor_id: 'vendor-demo-02',
      zone_id: 'zone-02',
      profiles: {
        full_name: 'Abdul Malek',
        business_name: 'Malek Fresh Fruits & Seasonal Produce',
        phone: '+880 1819-876543',
        nid_number: '1975269098765432',
        tin_number: '4390812399',
        home_address: 'Tejgaon Railgate Area, Dhaka-1215',
        operating_hours: '06:00 AM - 02:00 PM'
      },
      zones: { id: 'zone-02', name: 'Karwan Bazar Trade Corridor' }
    },
    {
      id: 'app-demo-03',
      created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      requested_from: '2026-01-01',
      requested_until: '2026-12-31',
      notes: '[Preferred Spot: DH-02] Traditional handmade winter pitha and tea setup near walkway entrance.',
      status: 'approved',
      vendor_id: 'vendor-demo-03',
      zone_id: 'zone-03',
      profiles: {
        full_name: 'Fatima Begum',
        business_name: 'Fatima Pitha & Street Sweets',
        phone: '+880 1912-334455',
        nid_number: '1992269055443322',
        tin_number: '7819203948',
        home_address: 'Road 8A, Dhanmondi, Dhaka-1209',
        operating_hours: '03:00 PM - 10:00 PM'
      },
      zones: { id: 'zone-03', name: 'Dhanmondi Lakefront Walkway' }
    }
  ], []);

  // Stable spot marker array
  const vendorSpotMarkers = useMemo(
    () => [...zoneSpots, ...allGuestSpots],
    [zoneSpots, allGuestSpots]
  );

  useEffect(() => {
    loadApps();
    if (!isAdmin) { loadZones(); loadAllGuestSpots(); }
    if (isAdmin) { loadDrawerZones(); }
  }, [isAdmin, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

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
        end_date: workspaceApp.requested_until || '2026-12-31',
        rent_amount: prev.rent_amount || '3500'
      }));
    }
  }, [workspaceApp]);

  async function loadDrawerZones() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
      setDrawerZones(res.data && res.data.length > 0 ? res.data : getDefaultZones());
    } catch {
      setDrawerZones(getDefaultZones());
    }
  }

  function getDefaultZones() {
    return [
      { id: 'zone-01', name: 'Mirpur Commercial Hub' },
      { id: 'zone-02', name: 'Karwan Bazar Trade Corridor' },
      { id: 'zone-03', name: 'Dhanmondi Lakefront Walkway' },
      { id: 'zone-04', name: 'Old Dhaka Heritage Food Trail' },
      { id: 'zone-05', name: 'Motijheel Financial District Verge' }
    ];
  }

  function getDefaultSpotsForZone() {
    return [
      { id: 'spot-01', spot_number: 'M10-01', status: 'available', description: 'North roundabout paved pavement' },
      { id: 'spot-02', spot_number: 'M10-02', status: 'available', description: 'Footbridge ramp verge' },
      { id: 'spot-03', spot_number: 'M10-04', status: 'available', description: 'West side walkway slot' },
      { id: 'spot-04', spot_number: 'KB-01', status: 'available', description: 'Wholesale produce market corridor' },
      { id: 'spot-05', spot_number: 'DH-02', status: 'available', description: 'Lakefront pedestrian promenade slot' }
    ];
  }

  async function loadDrawerSpots(zoneId) {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/spots?zone_id=${zoneId}`, { headers: { Authorization: `Bearer ${token}` } });
      const av = (res.data || []).filter(s => s.status === 'available');
      setDrawerSpots(av.length > 0 ? av : getDefaultSpotsForZone(zoneId));
    } catch {
      setDrawerSpots(getDefaultSpotsForZone(zoneId));
    }
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
      let list = res.data || [];
      if (isDemo && list.length === 0) {
        list = fallbackDemoApps;
      }
      setApps(list);
    } catch (err) {
      console.error('loadApps error:', err);
      if (isDemo) setApps(fallbackDemoApps);
    }
  }

  async function loadZones() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
      setZones(res.data && res.data.length > 0 ? res.data : getDefaultZones());
    } catch {
      setZones(getDefaultZones());
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
        try { parsed.boundary_geojson = JSON.parse(parsed.boundary_geojson); } catch { /* ignore parse error */ }
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
      let sp = (res.data || []).filter(s => s.latitude && s.longitude);
      if (sp.length === 0) {
        sp = [
          { id: 'spot-01', spot_number: 'M10-01', latitude: 23.8072, longitude: 90.3684, status: 'available', description: 'Corner pavillion' },
          { id: 'spot-02', spot_number: 'M10-02', latitude: 23.8065, longitude: 90.3690, status: 'occupied', description: 'Tea stall point' },
          { id: 'spot-03', spot_number: 'M10-04', latitude: 23.8068, longitude: 90.3687, status: 'available', description: 'Primary sidewalk verge' }
        ];
      }
      setZoneSpots(sp);
    } catch {
      setZoneSpots([
        { id: 'spot-01', spot_number: 'M10-01', latitude: 23.8072, longitude: 90.3684, status: 'available', description: 'Corner pavillion' },
        { id: 'spot-03', spot_number: 'M10-04', latitude: 23.8068, longitude: 90.3687, status: 'available', description: 'Primary sidewalk verge' }
      ]);
    }
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
      addToast('Application filed successfully with Municipal Licensing Desk!', 'success');
    } catch (err) {
      if (isDemo) {
        // Optimistic update for demo
        const selectedZoneObj = zones.find(z => z.id === formData.zone_id);
        const newApp = {
          id: `app-demo-${Date.now()}`,
          created_at: new Date().toISOString(),
          requested_from: formData.requested_from,
          requested_until: formData.requested_until,
          notes: (selectedSpot ? `[Preferred Spot: ${selectedSpot.spot_number}] ` : '') + formData.notes,
          status: 'pending',
          profiles: { full_name: profile?.full_name || 'Rahim Uddin', business_name: profile?.business_name || "Rahim's Tea & Fuchka Corner" },
          zones: { name: selectedZoneObj?.name || 'Mirpur Commercial Hub' }
        };
        setApps(prev => [newApp, ...prev]);
        setFormData({ zone_id: '', notes: '', requested_from: new Date().toISOString().split('T')[0], requested_until: '' });
        setSelectedZoneForMap(null);
        setZoneSpots([]);
        setSelectedSpot(null);
        addToast('Application filed in demo mode!', 'success');
      } else {
        addToast(err.response?.data?.error || 'Failed to submit application', 'danger');
      }
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
        spot_id: approvalForm.spot_id,
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
      if (isDemo) {
        // Optimistic demo update
        setApps(prev => prev.map(a => a.id === workspaceApp.id ? { ...a, status: 'approved' } : a));
        addToast('Application approved & license issued (Demo Mode)!', 'success');
        setWorkspaceApp(null);
      } else {
        addToast(err.response?.data?.error || 'Failed to process approval', 'danger');
      }
    } finally {
      setDrawerLoading(false);
    }
  }

  async function handleReject(appId, vendorId, zoneName, reason = '') {
    try {
      setDrawerLoading(true);
      const token = await getToken();
      await axios.put(`${import.meta.env.VITE_API_URL}/applications/${appId}`, { 
        status: 'rejected',
        admin_notes: reason 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      pushNotif(vendorId, 'Application Rejected ❌', `Your application for ${zoneName || 'a zone'} was rejected. Reason: ${reason || 'Not specified'}`);
      addToast('Application rejected and archived.', 'success');
      setWorkspaceApp(null);
      setRejectionReason('');
      loadApps();
    } catch (err) {
      if (isDemo) {
        setApps(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected', admin_notes: reason } : a));
        addToast('Application marked rejected (Demo Mode).', 'success');
        setWorkspaceApp(null);
        setRejectionReason('');
      } else {
        addToast(err.response?.data?.error || 'Failed to reject application', 'danger');
      }
    } finally {
      setDrawerLoading(false);
    }
  }

  function pushNotif(vendorId, title, message) {
    const all = JSON.parse(localStorage.getItem('sv_notifications') || '[]');
    all.unshift({ id: Date.now().toString(), target_vendor_id: vendorId, title, message, readBy: [], created_at: new Date().toISOString() });
    localStorage.setItem('sv_notifications', JSON.stringify(all));
  }

  const counts = { pending: 0, approved: 0, rejected: 0 };
  apps.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
  const filtered = apps.filter(a => filter === 'all' ? true : a.status === filter);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Municipal Docket Header Banner */}
      <div className="sv-card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--sv-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="sv-badge sv-badge-success">
                {isAdmin ? 'MUNICIPAL LICENSING AUTHORITY' : 'MERCHANT LICENSING DESK'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
                Dhaka Metropolitan City Corporation
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 2px' }}>
              {isAdmin ? 'Official Spot Application Registry & Audit' : 'Trade Spot Allocation & Permit Docket'}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--sv-text-secondary)' }}>
              {isAdmin 
                ? 'Review merchant trade dossiers, evaluate spatial boundaries, and issue authenticated digital licenses.' 
                : 'File applications for demarcated street trade positions and monitor official licensing status.'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs / Metric Counts */}
      <div className="row g-3">
        {[
          { key: 'pending', label: isAdmin ? 'Audit Queue (Pending)' : 'Under Evaluation', count: counts.pending, badgeClass: 'sv-badge-warning', borderCol: filter === 'pending' ? 'var(--sv-primary)' : 'var(--sv-border)' },
          { key: 'approved', label: isAdmin ? 'Licensed Permittees' : 'Approved Licenses', count: counts.approved, badgeClass: 'sv-badge-success', borderCol: filter === 'approved' ? 'var(--sv-primary)' : 'var(--sv-border)' },
          { key: 'rejected', label: 'Rejected / Archived', count: counts.rejected, badgeClass: 'sv-badge-danger', borderCol: filter === 'rejected' ? 'var(--sv-primary)' : 'var(--sv-border)' },
        ].map(tab => (
          <div key={tab.key} className="col-md-4">
            <div 
              onClick={() => setFilter(tab.key)}
              className="sv-card" 
              style={{ 
                padding: '16px 20px', 
                cursor: 'pointer', 
                border: `2px solid ${tab.borderCol}`,
                backgroundColor: filter === tab.key ? 'var(--sv-surface)' : 'var(--sv-canvas)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {tab.label}
                </span>
                <span className={`sv-badge ${tab.badgeClass}`}>
                  {tab.key.toUpperCase()}
                </span>
              </div>
              <div className="sv-mono-data" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--sv-text-primary)' }}>
                {tab.count}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* VENDOR APPLICATION FORM (Only for Merchants) */}
      {!isAdmin && (
        <div className="sv-card">
          <div className="sv-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h5>Apply for Demarcated Vending Position</h5>
              <span className="sv-badge sv-badge-info">STEP 1: ZONE & SPOT SELECTION</span>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                {/* Left: Input fields */}
                <div className="col-lg-5">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                        Target Municipal Zone <span style={{ color: 'var(--sv-status-danger)' }}>*</span>
                      </label>
                      <select 
                        className="form-select" 
                        value={formData.zone_id} 
                        onChange={e => handleZoneSelect(e.target.value)} 
                        required
                      >
                        <option value="">— Select Municipal Ward / Zone —</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    </div>

                    <div className="row g-2">
                      <div className="col-6">
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                          Requested From
                        </label>
                        <input 
                          type="date" 
                          className="form-control" 
                          value={formData.requested_from} 
                          onChange={e => setFormData({ ...formData, requested_from: e.target.value })} 
                        />
                      </div>
                      <div className="col-6">
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                          Requested Until
                        </label>
                        <input 
                          type="date" 
                          className="form-control" 
                          value={formData.requested_until} 
                          onChange={e => setFormData({ ...formData, requested_until: e.target.value })} 
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                        Trade Description / Business Notes
                      </label>
                      <textarea 
                        rows={3} 
                        className="form-control" 
                        placeholder="Detail merchandise, cart specifications, daily operating timings..." 
                        value={formData.notes} 
                        onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                      />
                    </div>

                    {selectedSpot && (
                      <div style={{ 
                        padding: '12px 14px', 
                        backgroundColor: 'var(--sv-surface-subtle)', 
                        border: '1px solid var(--sv-primary-border)', 
                        borderRadius: 'var(--sv-radius)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--sv-text-muted)', textTransform: 'uppercase' }}>Preferred Trade Spot</div>
                          <div className="sv-mono-data" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sv-primary)' }}>
                            #{selectedSpot.spot_number} ({selectedSpot.description || 'Pavement Slot'})
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setSelectedSpot(null)} 
                          className="btn btn-outline-dark btn-sm"
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="btn btn-primary w-100" 
                      disabled={loading || !formData.zone_id}
                      style={{ padding: '10px' }}
                    >
                      {loading ? 'Transmitting Docket...' : '🚀 Submit Official Spot Application'}
                    </button>
                  </div>
                </div>

                {/* Right: GIS Map & Available Spot Directory */}
                <div className="col-lg-7">
                  {zonesLoaded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
                      {formData.zone_id && selectedZoneForMap ? (
                        <>
                          {/* Available Spots Table */}
                          <div style={{ border: '1px solid var(--sv-border)', borderRadius: 'var(--sv-radius)', overflow: 'hidden' }}>
                            <div style={{ padding: '8px 12px', backgroundColor: 'var(--sv-surface-subtle)', borderBottom: '1px solid var(--sv-border)', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)' }}>
                              Demarcated Spots in {selectedZoneForMap.name}
                            </div>
                            <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                              <table className="sv-table">
                                <thead>
                                  <tr>
                                    <th>Spot ID</th>
                                    <th>Location Description</th>
                                    <th style={{ textAlign: 'right' }}>Selection</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {vendorSpotMarkers.map(s => {
                                    const isSelected = selectedSpot?.id === s.id;
                                    const isOccupied = s.status === 'occupied';
                                    const canSelect = !isOccupied;

                                    return (
                                      <tr 
                                        key={s.id}
                                        onClick={() => canSelect && setSelectedSpot(s)}
                                        style={{ 
                                          cursor: canSelect ? 'pointer' : 'not-allowed',
                                          backgroundColor: isSelected ? 'var(--sv-surface-subtle)' : 'transparent',
                                          opacity: isOccupied ? 0.6 : 1
                                        }}
                                      >
                                        <td className="sv-mono-data" style={{ fontWeight: 700 }}>
                                          #{s.spot_number || s.vendor_name}
                                          {isOccupied && (
                                            <span className="sv-badge sv-badge-danger" style={{ marginLeft: '6px', fontSize: '9px' }}>
                                              OCCUPIED
                                            </span>
                                          )}
                                        </td>
                                        <td style={{ fontSize: '12.5px', color: 'var(--sv-text-muted)' }}>
                                          {s.description || 'Designated sidewalk spot'}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                          <button
                                            type="button"
                                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-dark'}`}
                                            onClick={(e) => { e.stopPropagation(); canSelect && setSelectedSpot(s); }}
                                            disabled={!canSelect}
                                            style={{ padding: '3px 10px', fontSize: '11px' }}
                                          >
                                            {isSelected ? '✓ Selected' : isOccupied ? 'Locked' : 'Choose'}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Map view */}
                          <div style={{ height: '240px', border: '1px solid var(--sv-border)', borderRadius: 'var(--sv-radius)', overflow: 'hidden' }}>
                            <ZoneMap
                              key={`zone-map-${formData.zone_id}`}
                              zones={[selectedZoneForMap]}
                              spotMarkers={vendorSpotMarkers}
                              onSpotSelect={setSelectedSpot}
                              selectedSpotId={selectedSpot?.id || null}
                              viewOnly
                              height="100%"
                              hideDefaultLegend
                              center={selectedZoneForMap.boundary_geojson?.[0] || [23.8103, 90.4125]}
                            />
                          </div>
                        </>
                      ) : (
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          height: '100%', 
                          minHeight: '260px',
                          border: '1px dashed var(--sv-border)', 
                          borderRadius: 'var(--sv-radius)',
                          backgroundColor: 'var(--sv-surface-subtle)',
                          color: 'var(--sv-text-muted)'
                        }}>
                          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🗺️</div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>Select a municipal zone above</div>
                          <div style={{ fontSize: '11.5px' }}>Demarcated trade spots and GIS boundary will load dynamically</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLICATIONS REGISTRY LIST */}
      <div className="sv-card">
        <div className="sv-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h5>{isAdmin ? 'Municipal Application Registry' : 'My Application Filings'}</h5>
            <span className="sv-badge sv-badge-info">
              {filtered.length} {filter.toUpperCase()} RECORDS
            </span>
          </div>
        </div>

        <div style={{ padding: '16px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--sv-text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>No records found in this category.</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                {isAdmin ? 'Select another audit filter from above.' : 'Submit an application above to initiate licensing.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map(a => {
                const preferredSpot = parsePreferredSpot(a.notes);
                const statusBadge = a.status === 'approved' ? 'sv-badge-success' : a.status === 'pending' ? 'sv-badge-warning' : 'sv-badge-danger';

                return (
                  <div 
                    key={a.id} 
                    style={{ 
                      padding: '16px', 
                      backgroundColor: 'var(--sv-surface)', 
                      border: '1px solid var(--sv-border)', 
                      borderRadius: 'var(--sv-radius)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                  >
                    {/* Left: Applicant identity stamp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '260px' }}>
                      <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: 'var(--sv-radius)', 
                        backgroundColor: 'var(--sv-primary)', 
                        color: '#FFFFFF', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '15px',
                        fontWeight: 700,
                        fontFamily: 'var(--sv-font-mono)',
                        flexShrink: 0
                      }}>
                        {initials(a.profiles?.full_name)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--sv-text-primary)' }}>
                          {a.profiles?.full_name || 'Anonymous Vendor'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--sv-text-secondary)' }}>
                          {a.profiles?.business_name || 'Individual Merchant'} · Tel: {a.profiles?.phone || 'On file'}
                        </div>
                      </div>
                    </div>

                    {/* Center: Ward / Spot Allocation */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span className="sv-badge" style={{ backgroundColor: 'var(--sv-surface-subtle)', border: '1px solid var(--sv-border)', color: 'var(--sv-text-primary)' }}>
                          Ward: {a.zones?.name || 'Dhaka Metropolitan'}
                        </span>
                        {preferredSpot && (
                          <span className="sv-badge sv-badge-info">
                            Prefers #{preferredSpot}
                          </span>
                        )}
                      </div>
                      <div className="sv-mono-data" style={{ fontSize: '11px', color: 'var(--sv-text-muted)' }}>
                        Filed: {fmtDate(a.created_at)} · Window: {fmtDate(a.requested_from)} → {a.requested_until ? fmtDate(a.requested_until) : 'Annual'}
                      </div>
                      {a.status === 'rejected' && a.admin_notes && (
                        <div style={{ fontSize: '11.5px', color: 'var(--sv-status-danger)', marginTop: '4px' }}>
                          Reason: {a.admin_notes}
                        </div>
                      )}
                    </div>

                    {/* Right: Status & Admin Action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`sv-badge ${statusBadge}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                        {a.status.toUpperCase()}
                      </span>

                      {isAdmin && a.status === 'pending' && (
                        <button 
                          onClick={() => setWorkspaceApp(a)} 
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 14px' }}
                        >
                          Audit & License →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ADMIN REVIEW WORKSPACE MODAL */}
      {workspaceApp && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: 99999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '20px',
          backgroundColor: 'rgba(11, 24, 18, 0.75)',
          backdropFilter: 'blur(6px)'
        }}>
          <div 
            className="sv-card" 
            style={{ 
              width: '100%', 
              maxWidth: '1080px', 
              maxHeight: '90vh', 
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: 'var(--sv-shadow-lg)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ 
              backgroundColor: 'var(--sv-primary)', 
              color: '#FFFFFF', 
              padding: '20px 24px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85, marginBottom: '4px' }}>
                  ⚖️ DHAKA CITY CORPORATION · LICENSING AUDIT & PERMIT ISSUANCE
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  Application Dossier: {workspaceApp.profiles?.full_name}
                </h3>
              </div>
              <button 
                onClick={() => setWorkspaceApp(null)} 
                className="btn btn-outline-dark btn-sm"
                style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.4)', background: 'transparent' }}
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div className="row g-4">
                {/* Left: Applicant Dossier */}
                <div className="col-lg-6">
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: 'var(--sv-surface-subtle)', 
                    border: '1px solid var(--sv-border)', 
                    borderRadius: 'var(--sv-radius)',
                    height: '100%'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--sv-text-muted)', marginBottom: '14px', letterSpacing: '0.04em' }}>
                      📋 Applicant Civic Credentials
                    </div>

                    <div className="row g-3">
                      <div className="col-6">
                        <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)', textTransform: 'uppercase' }}>National ID (NID)</div>
                        <div className="sv-mono-data" style={{ fontSize: '13px', fontWeight: 700 }}>
                          {workspaceApp.profiles?.nid_number || '1988269012345678'}
                        </div>
                      </div>

                      <div className="col-6">
                        <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)', textTransform: 'uppercase' }}>Tax Identification (TIN)</div>
                        <div className="sv-mono-data" style={{ fontSize: '13px', fontWeight: 700 }}>
                          {workspaceApp.profiles?.tin_number || '5421980341'}
                        </div>
                      </div>

                      <div className="col-12" style={{ borderTop: '1px solid var(--sv-border)', paddingTop: '10px' }}>
                        <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)', textTransform: 'uppercase' }}>Business Title</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600 }}>
                          {workspaceApp.profiles?.business_name || "Rahim's Tea & Fuchka Corner"}
                        </div>
                      </div>

                      <div className="col-6">
                        <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)', textTransform: 'uppercase' }}>Operating Hours</div>
                        <div style={{ fontSize: '12.5px' }}>
                          {workspaceApp.profiles?.operating_hours || '07:00 AM - 10:30 PM'}
                        </div>
                      </div>

                      <div className="col-6">
                        <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)', textTransform: 'uppercase' }}>Telephone</div>
                        <div className="sv-mono-data" style={{ fontSize: '12.5px' }}>
                          {workspaceApp.profiles?.phone || '+880 1711-234567'}
                        </div>
                      </div>

                      <div className="col-12" style={{ borderTop: '1px solid var(--sv-border)', paddingTop: '10px' }}>
                        <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)', textTransform: 'uppercase' }}>Registered Residence</div>
                        <div style={{ fontSize: '12.5px' }}>
                          {workspaceApp.profiles?.home_address || 'Section 10, Mirpur, Dhaka-1216'}
                        </div>
                      </div>

                      <div className="col-12" style={{ borderTop: '1px solid var(--sv-border)', paddingTop: '10px' }}>
                        <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)', textTransform: 'uppercase' }}>Requested Duration & Preference</div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
                          {fmtDate(workspaceApp.requested_from)} → {workspaceApp.requested_until ? fmtDate(workspaceApp.requested_until) : '12 Months'} 
                          {parsePreferredSpot(workspaceApp.notes) && ` · Prefers Spot #${parsePreferredSpot(workspaceApp.notes)}`}
                        </div>
                      </div>

                      {cleanNotes(workspaceApp.notes) && (
                        <div className="col-12" style={{ borderTop: '1px solid var(--sv-border)', paddingTop: '10px' }}>
                          <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Merchant Declaration</div>
                          <div style={{ 
                            fontSize: '12px', 
                            fontStyle: 'italic', 
                            padding: '10px 12px', 
                            backgroundColor: 'var(--sv-surface)', 
                            border: '1px solid var(--sv-border)',
                            borderRadius: 'var(--sv-radius)' 
                          }}>
                            "{cleanNotes(workspaceApp.notes)}"
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Allocation & Permitting Desk */}
                <div className="col-lg-6">
                  <div style={{ 
                    padding: '20px', 
                    backgroundColor: 'var(--sv-surface)', 
                    border: '1px solid var(--sv-border)', 
                    borderRadius: 'var(--sv-radius)' 
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--sv-primary)', marginBottom: '14px', letterSpacing: '0.04em' }}>
                      ⚖️ Spot Assignment & License Issuance
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                          Designated Vending Zone
                        </label>
                        <select 
                          className="form-select" 
                          value={drawerSelZone} 
                          onChange={e => setDrawerSelZone(e.target.value)}
                        >
                          <option value="">— Select Municipal Zone —</option>
                          {drawerZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                          Allocate Demarcated Spot
                        </label>
                        <div style={{ 
                          maxHeight: '120px', 
                          overflowY: 'auto', 
                          padding: '8px', 
                          backgroundColor: 'var(--sv-surface-subtle)', 
                          border: '1px solid var(--sv-border)', 
                          borderRadius: 'var(--sv-radius)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}>
                          {drawerSpots.length > 0 ? drawerSpots.map(s => {
                            const isChosen = approvalForm.spot_id === s.id;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setApprovalForm({ ...approvalForm, spot_id: s.id })}
                                className="btn btn-sm"
                                style={{
                                  backgroundColor: isChosen ? 'var(--sv-primary)' : 'var(--sv-surface)',
                                  color: isChosen ? '#FFFFFF' : 'var(--sv-text-primary)',
                                  border: `1px solid ${isChosen ? 'var(--sv-primary)' : 'var(--sv-border)'}`,
                                  fontFamily: 'var(--sv-font-mono)',
                                  fontSize: '11.5px',
                                  padding: '4px 10px'
                                }}
                              >
                                #{s.spot_number}
                              </button>
                            );
                          }) : (
                            <div style={{ width: '100%', textAlign: 'center', fontSize: '11.5px', color: 'var(--sv-text-muted)', padding: '10px 0' }}>
                              {drawerSelZone ? 'No available spots in this zone.' : 'Select a zone first.'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="row g-2">
                        <div className="col-6">
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                            Monthly Lease Fee (৳)
                          </label>
                          <input 
                            type="number" 
                            className="form-control" 
                            placeholder="3500" 
                            value={approvalForm.rent_amount} 
                            onChange={e => setApprovalForm({ ...approvalForm, rent_amount: e.target.value })} 
                          />
                        </div>
                        <div className="col-6">
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                            License Permit Class
                          </label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={approvalForm.permission_type} 
                            onChange={e => setApprovalForm({ ...approvalForm, permission_type: e.target.value })} 
                          />
                        </div>
                      </div>

                      <div className="row g-2">
                        <div className="col-6">
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                            Valid From
                          </label>
                          <input 
                            type="date" 
                            className="form-control" 
                            value={approvalForm.start_date} 
                            onChange={e => setApprovalForm({ ...approvalForm, start_date: e.target.value })} 
                          />
                        </div>
                        <div className="col-6">
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                            Valid Until
                          </label>
                          <input 
                            type="date" 
                            className="form-control" 
                            value={approvalForm.end_date} 
                            onChange={e => setApprovalForm({ ...approvalForm, end_date: e.target.value })} 
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: '10px' }}>
                        <button 
                          onClick={handleUnifiedApprove} 
                          disabled={drawerLoading || !approvalForm.spot_id || !approvalForm.rent_amount}
                          className="btn btn-primary w-100"
                          style={{ padding: '10px', fontSize: '14px' }}
                        >
                          {drawerLoading ? '⚡ Processing Allocation...' : '🌟 Issue Authenticated License & Assign Spot'}
                        </button>
                      </div>

                      {/* Rejection Subsection */}
                      <div style={{ marginTop: '16px', borderTop: '1px solid var(--sv-border)', paddingTop: '14px' }}>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-status-danger)', marginBottom: '4px' }}>
                          Reject Application (Internal Audit Rationale)
                        </label>
                        <textarea 
                          rows={2} 
                          className="form-control" 
                          placeholder="State legal or spatial reason for rejection..." 
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          style={{ fontSize: '12px', marginBottom: '8px' }}
                        />
                        <button 
                          onClick={() => handleReject(workspaceApp.id, workspaceApp.vendor_id, workspaceApp.zones?.name, rejectionReason)}
                          className="btn btn-outline-danger w-100 btn-sm"
                        >
                          Reject Application & Notify Merchant
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

