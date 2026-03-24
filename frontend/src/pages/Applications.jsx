import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import ZoneMap from '../components/ZoneMap';

export default function Applications() {
  const { addToast } = useToast();
  const { confirmAction } = useConfirm();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [zones, setZones] = useState([]);
  const [zoneSpots, setZoneSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [formData, setFormData] = useState({ zone_id: '', notes: '' });
  const [selectedZoneForMap, setSelectedZoneForMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const { profile, getToken } = useAuth();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    loadApps();
    if (!isAdmin) loadZones();
  }, [isAdmin]);

  async function loadApps() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/applications`, { headers: { Authorization: `Bearer ${token}` } });
      setApps(res.data);
    } catch (err) {
      console.error('Failed to load applications', err.response?.data);
    }
  }

  async function loadZones() {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
    setZones(res.data);
  }

  function handleZoneSelect(zoneId) {
    setFormData(f => ({ ...f, zone_id: zoneId }));
    setSelectedSpot(null);
    const zone = zones.find(z => z.id === zoneId);
    if (zone) {
      // Parse boundary if it's a string
      if (zone.boundary_geojson && typeof zone.boundary_geojson === 'string') {
        try { zone.boundary_geojson = JSON.parse(zone.boundary_geojson); } catch(e) {}
      }
      setSelectedZoneForMap(zone);
      loadZoneSpots(zoneId);
    } else {
      setSelectedZoneForMap(null);
      setZoneSpots([]);
    }
  }

  async function loadZoneSpots(zoneId) {
    try {
      const token = await getToken();
      // Load all blocks for this zone, then spots
      const blocksRes = await axios.get(`${import.meta.env.VITE_API_URL}/blocks?zone_id=${zoneId}`, { headers: { Authorization: `Bearer ${token}` } });
      const blockIds = blocksRes.data.map(b => b.id);
      if (blockIds.length === 0) return setZoneSpots([]);
      // Load spots for each block
      const spotPromises = blockIds.map(bid =>
        axios.get(`${import.meta.env.VITE_API_URL}/spots?block_id=${bid}`, { headers: { Authorization: `Bearer ${token}` } })
      );
      const results = await Promise.all(spotPromises);
      const allSpots = results.flatMap(r => r.data);
      setZoneSpots(allSpots.filter(s => s.latitude && s.longitude));
    } catch (e) {
      console.error('Failed to load zone spots', e);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      // Auto-append preferred spot to notes
      const spotNote = selectedSpot ? `[Preferred Spot: ${selectedSpot.spot_number}] ` : '';
      const payload = { ...formData, notes: spotNote + formData.notes };
      await axios.post(`${import.meta.env.VITE_API_URL}/applications`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ zone_id: '', notes: '' });
      setSelectedZoneForMap(null);
      setZoneSpots([]);
      setSelectedSpot(null);
      loadApps();
      addToast('Application submitted successfully!', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to submit application', 'danger');
    } finally { setLoading(false); }
  }

  async function handleApproveAndRedirect(app, target) {
    // First approve the application
    try {
      const token = await getToken();
      await axios.put(`${import.meta.env.VITE_API_URL}/applications/${app.id}`, { status: 'approved' }, { headers: { Authorization: `Bearer ${token}` } });
      
      // Parse preferred spot if exists
      let preferredSpot = null;
      if (app.notes && app.notes.includes('[Preferred Spot:')) {
        const match = app.notes.match(/\[Preferred Spot:\s*([^\]]+)\]/);
        if (match) preferredSpot = match[1].trim();
      }

      const state = {
        vendor_id: app.vendor_id,
        zone_id: app.zone_id,
        preferred_spot_number: preferredSpot
      };

      addToast(`Application approved! Redirecting to ${target === 'assign' ? 'Assignments' : 'Permissions'}...`, 'success');
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate(target === 'assign' ? '/admin/assignments' : '/admin/permissions', { state });
      }, 800);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to approve application', 'danger');
    }
  }

  async function handleStatusUpdate(id, status) {
    confirmAction({
      title: `Confirm ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Are you sure you want to mark this application as ${status}?`,
      confirmText: `Yes, ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      onConfirm: async () => {
        try {
          const token = await getToken();
          await axios.put(`${import.meta.env.VITE_API_URL}/applications/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
          
          const app = apps.find(a => a.id === id);
          if (app && app.vendor_id) {
            const allNotifs = JSON.parse(localStorage.getItem('sv_notifications') || '[]');
            allNotifs.unshift({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
              target_vendor_id: app.vendor_id,
              title: status === 'approved' ? 'Application Approved 🎊' : 'Application Rejected ❌',
              message: `Your application for ${app.zones?.name || 'a zone'} was ${status}.`,
              readBy: [],
              created_at: new Date().toISOString()
            });
            localStorage.setItem('sv_notifications', JSON.stringify(allNotifs));
          }
          
          loadApps();
          addToast(`Application marked as ${status}`, 'success');
        } catch (err) {
          addToast(err.response?.data?.error || 'Failed to update status', 'danger');
        }
      }
    });
  }

  const statusBadge = (status) => {
    const map = { pending: 'warning', approved: 'success', rejected: 'danger' };
    return <span className={`sv-badge sv-badge-${map[status] || 'secondary'}`}>{status}</span>;
  };

  return (
    <div>
      <div className="sv-page-header">
        <h3>{isAdmin ? '📋 Vendor Applications' : '📝 My Applications'}</h3>
        <p>{isAdmin ? 'Review and action vendor zone applications' : 'Apply for a zone and track your application status'}</p>
      </div>

      {/* Vendor: Apply Form */}
      {!isAdmin && (
        <div className="sv-form-card mb-4">
          <h6 style={{ fontWeight: 700, color: '#1a6b3c', marginBottom: 16 }}>Apply for a Zone</h6>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <select className="form-select" value={formData.zone_id} onChange={e => handleZoneSelect(e.target.value)} required>
                  <option value="">-- Select Preferred Zone --</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name} {z.area ? `(${z.area})` : ''}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <input type="text" placeholder="Additional Notes (e.g., selling fruits, morning only)" className="form-control" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-primary w-100" style={{ borderRadius: 8 }} disabled={loading}>
                  {loading ? '...' : 'Submit'}
                </button>
              </div>
            </div>

            {/* Zone Map Preview for vendor — shows zone polygon + available spots */}
            {selectedZoneForMap && (
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="small fw-semibold" style={{ color: '#1a6b3c' }}>🗺️ Zone Map — Click a 🟢 green spot to select it</div>
                  <span className="small text-muted">{zoneSpots.length} spot{zoneSpots.length !== 1 ? 's' : ''} on map</span>
                </div>
                {selectedSpot && (
                  <div className="d-flex align-items-center gap-3 mb-2 p-2 rounded" style={{ background: '#ede9fe', border: '1px solid #c4b5fd' }}>
                    <span style={{ fontSize: 20 }}>📌</span>
                    <div>
                      <div className="fw-bold" style={{ color: '#6d28d9' }}>Spot {selectedSpot.spot_number} Selected</div>
                      <div className="small text-muted">Block: {selectedSpot.blocks?.block_name} · Click the spot again or another to change</div>
                    </div>
                    <button type="button" className="btn btn-sm ms-auto" style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 6 }} onClick={() => setSelectedSpot(null)}>✕ Deselect</button>
                  </div>
                )}
                <ZoneMap
                  zones={[selectedZoneForMap]}
                  spotMarkers={zoneSpots}
                  onSpotSelect={setSelectedSpot}
                  selectedSpotId={selectedSpot?.id || null}
                  viewOnly
                  height="300px"
                  center={Array.isArray(selectedZoneForMap.boundary_geojson) && selectedZoneForMap.boundary_geojson[0] ? selectedZoneForMap.boundary_geojson[0] : (selectedZoneForMap.latitude ? [selectedZoneForMap.latitude, selectedZoneForMap.longitude] : null)}
                />

                {/* Spot list table for vendor */}
                {zoneSpots.length > 0 ? (
                  <div className="mt-3">
                    <div className="small fw-semibold mb-2" style={{ color: '#334155' }}>📋 Available Spots in {selectedZoneForMap.name}</div>
                    <div className="table-responsive rounded border">
                      <table className="table table-sm table-hover mb-0 align-middle">
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            <th style={{ fontSize: 12 }}>Spot</th>
                            <th style={{ fontSize: 12 }}>Block</th>
                            <th style={{ fontSize: 12 }}>Status</th>
                            <th style={{ fontSize: 12 }}>GPS</th>
                            <th style={{ fontSize: 12 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {zoneSpots.map(s => (
                            <tr key={s.id} style={{ background: selectedSpot?.id === s.id ? '#ede9fe' : undefined }}>
                              <td className="fw-semibold" style={{ fontSize: 13 }}>{s.spot_number}</td>
                              <td className="text-muted" style={{ fontSize: 12 }}>{s.blocks?.block_name}</td>
                              <td>
                                <span className={`badge bg-${s.status === 'available' ? 'success' : s.status === 'occupied' ? 'danger' : 'warning'}`} style={{ fontSize: 10 }}>
                                  {s.status}
                                </span>
                              </td>
                              <td className="text-muted" style={{ fontSize: 10 }}>{s.latitude ? `✔️ ${Number(s.latitude).toFixed(3)}, ${Number(s.longitude).toFixed(3)}` : '—'}</td>
                              <td className="text-end">
                                {s.status === 'available' ? (
                                  selectedSpot?.id === s.id ? (
                                    <button type="button" className="btn btn-sm" style={{ fontSize: 11, background: '#ede9fe', color: '#6d28d9', borderRadius: 6 }} onClick={() => setSelectedSpot(null)}>✓ Selected</button>
                                  ) : (
                                    <button type="button" className="btn btn-sm btn-success" style={{ fontSize: 11, borderRadius: 6 }} onClick={() => setSelectedSpot(s)}>Select</button>
                                  )
                                ) : (
                                  <span className="text-muted" style={{ fontSize: 11 }}>Unavailable</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted small mt-2 text-center py-2" style={{ background: '#f8fafc', borderRadius: 8 }}>
                    No spots with GPS coordinates found in this zone yet.
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Applications Table */}
      <div className="sv-card">
        <div className="sv-card-header">
          <h5>{isAdmin ? `All Applications (${apps.length})` : `My Applications (${apps.length})`}</h5>
        </div>
        <table className="sv-table">
          <thead>
            <tr>
              {isAdmin && <th>Vendor</th>}
              <th>Zone</th>
              <th>Notes</th>
              <th>Status</th>
              <th>Applied On</th>
              {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 && (
              <tr><td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: 28, color: '#94a3b8' }}>
                {isAdmin ? 'No applications received yet.' : 'No applications yet. Use the form above to apply.'}
              </td></tr>
            )}
            {apps.map(a => (
              <tr key={a.id}>
                {isAdmin && (
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.profiles?.full_name || '—'}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.profiles?.phone || 'No phone'}</div>
                  </td>
                )}
                <td style={{ fontWeight: 600 }}>{a.zones?.name || '—'}</td>
                <td style={{ color: '#64748b', fontSize: 12 }}>{a.notes || '—'}</td>
                <td>{statusBadge(a.status)}</td>
                <td style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                {isAdmin && (
                  <td style={{ textAlign: 'right' }}>
                    {a.status === 'pending' ? (
                      <div className="d-flex gap-2 justify-content-end">
                        <div className="btn-group">
                          <button onClick={() => handleApproveAndRedirect(a, 'assign')} className="btn btn-sm btn-success" style={{ borderRadius: '6px 0 0 6px', fontSize: 11 }}>Approve & Assign</button>
                          <button type="button" className="btn btn-sm btn-success dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false" style={{ borderRadius: '0 6px 6px 0' }}>
                            <span className="visually-hidden">Toggle Dropdown</span>
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ fontSize: 13, borderRadius: 12 }}>
                            <li><button className="dropdown-item py-2" onClick={() => handleApproveAndRedirect(a, 'permit')}>Approve & Grant Permission</button></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><button className="dropdown-item py-2 text-danger" onClick={() => handleStatusUpdate(a.id, 'rejected')}>Reject Application</button></li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="small text-muted">{a.status === 'approved' ? 'Processed' : 'Rejected'}</div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
