import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import ZoneMap from '../components/ZoneMap';

export default function Zones() {
  const [zones, setZones] = useState([]);
  const [formData, setFormData] = useState({ name: '', area: '', description: '', boundary_geojson: [] });
  const [loading, setLoading] = useState(false);
  
  // Spot Management State
  const [activeZoneForSpots, setActiveZoneForSpots] = useState(null);
  const [zoneSpots, setZoneSpots] = useState([]);
  const [newSpot, setNewSpot] = useState({ spot_number: '', description: '', latitude: null, longitude: null });
  const [spotLoading, setSpotLoading] = useState(false);

  // Force map to pan to specific center
  const [mapCenterOverride, setMapCenterOverride] = useState(null);

  const { getToken } = useAuth();
  const { addToast } = useToast();
  const { confirmAction } = useConfirm();

  useEffect(() => { loadZones(); }, []);

  async function loadZones() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
      const parsedZones = res.data.map(z => {
        if (typeof z.boundary_geojson === 'string') {
          try { z.boundary_geojson = JSON.parse(z.boundary_geojson); } catch(e) {}
        }
        return z;
      });
      setZones(parsedZones);
    } catch (err) {
      addToast('Failed to load zones', 'danger');
    }
  }

  function handleMapPick(point) {
    setFormData(f => ({ ...f, boundary_geojson: [...f.boundary_geojson, point] }));
  }

  function handleUndoPick() {
    setFormData(f => ({ ...f, boundary_geojson: f.boundary_geojson.slice(0, -1) }));
  }

  function handleClearPick() {
    setFormData(f => ({ ...f, boundary_geojson: [] }));
  }

  function handlePanToZone(z) {
    if (Array.isArray(z.boundary_geojson) && z.boundary_geojson.length > 0) {
      setMapCenterOverride(z.boundary_geojson[0]);
      addToast(`Showing ${z.name} on map`, 'info');
    } else if (z.latitude && z.longitude) {
      setMapCenterOverride([z.latitude, z.longitude]);
      addToast(`Showing ${z.name} on map`, 'info');
    } else {
      addToast('This zone does not have coordinates mapped.', 'warning');
    }
  }

  // --- SPOT MANAGEMENT LOGIC ---
  async function loadZoneSpots(zoneId) {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/spots?zone_id=${zoneId}`, { headers: { Authorization: `Bearer ${token}` } });
      setZoneSpots(res.data);
    } catch (err) {
      addToast('Failed to load spots', 'danger');
    }
  }

  function handleManageSpots(zone) {
    setActiveZoneForSpots(zone);
    loadZoneSpots(zone.id);
    handlePanToZone(zone);
    setTimeout(() => {
      document.getElementById('spot-manager-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  function handleCloseSpots() {
    setActiveZoneForSpots(null);
    setZoneSpots([]);
    setNewSpot({ spot_number: '', description: '', latitude: null, longitude: null });
  }

  async function handleAddSpot(e) {
    e.preventDefault();
    setSpotLoading(true);
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/spots`, {
        ...newSpot,
        zone_id: activeZoneForSpots.id
      }, { headers: { Authorization: `Bearer ${token}` } });
      addToast('Spot created successfully', 'success');
      setNewSpot({ spot_number: '', description: '', latitude: null, longitude: null });
      loadZoneSpots(activeZoneForSpots.id);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create spot', 'danger');
    } finally {
      setSpotLoading(false);
    }
  }

  async function handleDeleteSpot(spotId) {
    confirmAction({
      title: 'Delete Spot',
      message: 'Are you sure you want to delete this spot?',
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
        try {
          const token = await getToken();
          await axios.delete(`${import.meta.env.VITE_API_URL}/spots/${spotId}`, { headers: { Authorization: `Bearer ${token}` } });
          addToast('Spot deleted', 'success');
          loadZoneSpots(activeZoneForSpots.id);
        } catch (err) {
          addToast(err.response?.data?.error || 'Failed to delete spot', 'danger');
        }
      }
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (formData.boundary_geojson.length === 2) {
      return addToast('A zone needs 1 point for a marker, or 3+ points for a geographic area boundary.', 'warning');
    }
    setLoading(true);
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/zones`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ name: '', area: '', description: '', boundary_geojson: [] });
      setMapCenterOverride(null);
      loadZones();
      addToast('Zone created successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create zone', 'danger');
    } finally { setLoading(false); }
  }

  async function handleDelete(id) {
    confirmAction({
      title: 'Delete Zone',
      message: 'Delete this zone? This will also remove all blocks and spots inside it.',
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
        try {
          const token = await getToken();
          await axios.delete(`${import.meta.env.VITE_API_URL}/zones/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          loadZones();
          addToast('Zone deleted', 'success');
          if (formData.boundary_geojson.length > 0) setMapCenterOverride([23.8103, 90.4125]);
        } catch (err) {
          addToast(err.response?.data?.error || 'Failed to delete zone. It may have existing records.', 'danger');
        }
      }
    });
  }

  return (
    <div className="p-4 animate-entrance" style={{ maxWidth: 1400, margin: '0 auto' }}>
      <div className="sv-page-header mb-4">
        <h3>🗺️ Geographic Zones</h3>
        <p>Manage physical vending zones. Click anywhere on the map below to pinpoint a new zone's location.</p>
      </div>

      {/* Permanent Interactive Map */}
      <div className="sv-card mb-4 overflow-hidden border-0 shadow-sm">
        <ZoneMap 
          zones={zones} 
          selectedPolygon={formData.boundary_geojson} 
          onPick={handleMapPick} 
          onClearPick={handleClearPick}
          onUndoPick={handleUndoPick}
          height="450px"
          center={mapCenterOverride}
        />
        <div className="bg-light p-2 text-center small text-muted border-top">
          📍 <strong>Tip:</strong> Click an existing zone's shape/pin to see its info. Click an empty space 1 time to drop a pin, or 3+ times to draw an area.
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Create Zone Form */}
        <div className="col-md-5">
          <div className="sv-card h-100">
            <div className="sv-card-header">
              <h5 className="mb-0 text-success fw-bold">+ Add New Zone</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Zone Name *</label>
                  <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Area / City</label>
                  <input type="text" className="form-control" value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Description</label>
                  <textarea rows="2" className="form-control" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                </div>
                
                <div className="p-3 mb-4 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="small fw-semibold text-muted mb-1">Target Coordinates:</div>
                  {formData.boundary_geojson.length > 0 ? (
                    <div className="text-success fw-bold font-monospace small" style={{ wordBreak: 'break-all' }}>
                      {formData.boundary_geojson.length === 1 ? '1 Point Marker' : `${formData.boundary_geojson.length} Point Area`} defined.
                    </div>
                  ) : (
                    <div className="text-danger small">No region picked. Click on the map to draw.</div>
                  )}
                </div>

                <button type="submit" className="btn btn-success w-100 py-2" style={{ borderRadius: 8 }} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Zone'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Zones List */}
        <div className="col-md-7">
          <div className="sv-card h-100">
            <div className="sv-card-header">
              <h5 className="mb-0">Active Zones ({zones.length})</h5>
            </div>
            <div className="table-responsive">
              <table className="sv-table">
                <thead>
                  <tr>
                    <th>Details</th>
                    <th>Coordinates</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map(z => (
                    <tr key={z.id}>
                      <td>
                        <div className="fw-bold">{z.name}</div>
                        <div className="small text-muted">{z.area || z.description || 'No description'}</div>
                      </td>
                      <td>
                        {Array.isArray(z.boundary_geojson) && z.boundary_geojson.length > 0 ? (
                          <span className={`badge bg-light font-monospace border ${z.boundary_geojson.length === 1 ? 'text-dark' : 'text-primary'}`}>
                            {z.boundary_geojson.length === 1 ? '1-Point Pin' : `${z.boundary_geojson.length}-Point Polygon`}
                          </span>
                        ) : z.latitude ? (
                          <span className="badge bg-light text-dark font-monospace border">
                            {z.latitude.toFixed(3)}, {z.longitude.toFixed(3)}
                          </span>
                        ) : (
                          <span className="small text-muted">—</span>
                        )}
                      </td>
                      <td className="text-end text-nowrap">
                        <button 
                          onClick={() => handlePanToZone(z)} 
                          className="btn btn-sm btn-outline-primary me-2" 
                          style={{ borderRadius: 6 }}
                          title="View on Map"
                        >
                          📍 Show
                        </button>
                        <button 
                          onClick={() => handleManageSpots(z)} 
                          className="btn btn-sm btn-outline-success me-2" 
                          style={{ borderRadius: 6 }}
                          title="Manage Spots"
                        >
                          ⚙️ Spots
                        </button>
                        <button 
                          onClick={() => handleDelete(z.id)} 
                          className="btn btn-sm" 
                          style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 6 }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {zones.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-5 text-muted">
                        No zones found. Create your first zone.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Target Zone Spot Manager Panel */}
      {activeZoneForSpots && (
        <div id="spot-manager-panel" className="sv-card mb-4 mt-2 shadow border bg-white" style={{ borderColor: '#1a6b3c !important' }}>
          <div className="sv-card-header d-flex justify-content-between align-items-center" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <h5 className="mb-0 fw-bold" style={{ color: '#1a6b3c' }}>
              📍 Manage Spots: {activeZoneForSpots.name}
            </h5>
            <button onClick={handleCloseSpots} className="btn-close" aria-label="Close"></button>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              {/* Interactive Spot Map - Full Width */}
              <div className="col-12">
                <div className="p-3 rounded-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0 text-success">1. Pick Spot Location on Map</h6>
                    <div className="small text-muted fw-bold">
                      {newSpot.latitude ? <span className="text-success">📍 Selected: {newSpot.latitude.toFixed(5)}, {newSpot.longitude.toFixed(5)}</span> : <span>⚠️ Click on map to drop pin</span>}
                    </div>
                  </div>
                  <div style={{ height: '380px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <ZoneMap
                      zones={[activeZoneForSpots]}
                      spotMarkers={zoneSpots}
                      boundary={activeZoneForSpots.boundary_geojson}
                      selectedPolygon={newSpot.latitude ? [[newSpot.latitude, newSpot.longitude]] : []}
                      onPick={(pt) => setNewSpot(s => ({ ...s, latitude: pt[0], longitude: pt[1] }))}
                      height="380px"
                      center={Array.isArray(activeZoneForSpots.boundary_geojson) && activeZoneForSpots.boundary_geojson.length > 0 ? activeZoneForSpots.boundary_geojson[0] : [activeZoneForSpots.latitude || 23.8103, activeZoneForSpots.longitude || 90.4125]}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4 mt-1">
              {/* Create Spot Form */}
              <div className="col-md-5">
                <div className="p-4 rounded-4 shadow-sm" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                  <h6 className="fw-bold mb-4" style={{ color: '#0f172a' }}>2. Spot Details</h6>
                  <form onSubmit={handleAddSpot}>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Spot Number / ID *</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={newSpot.spot_number} 
                        onChange={e => setNewSpot({ ...newSpot, spot_number: e.target.value })} 
                        required 
                        placeholder="e.g. A-12, Kiosk-5"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label small fw-semibold">Description (Optional)</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={newSpot.description} 
                        onChange={e => setNewSpot({ ...newSpot, description: e.target.value })} 
                        placeholder="Location details"
                      />
                    </div>
                    <button type="submit" className="btn btn-success w-100 py-2 fw-bold shadow-sm" style={{ borderRadius: 8 }} disabled={spotLoading || !newSpot.latitude}>
                      {spotLoading ? 'Adding...' : '+ Add Spot at Location'}
                    </button>
                    {!newSpot.latitude && (
                      <div className="text-danger small mt-2 text-center">Please click on the map to set location</div>
                    )}
                  </form>
                </div>
              </div>

              {/* Spot List */}
              <div className="col-md-7">
                <div className="p-4 rounded-4 shadow-sm h-100" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                  <h6 className="fw-bold mb-3" style={{ color: '#0f172a' }}>Current Zone Spots ({zoneSpots.length})</h6>
                  <div className="table-responsive border rounded" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <table className="sv-table mb-0">
                    <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <tr>
                        <th className="py-3 px-3">Spot Number</th>
                        <th className="py-3 px-3">Details</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="text-end py-3 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zoneSpots.map(s => (
                        <tr key={s.id}>
                          <td className="fw-bold px-3">{s.spot_number}</td>
                          <td className="small text-muted px-3">{s.description || '—'}</td>
                          <td className="px-3">
                            <span className={`badge ${s.status === 'available' ? 'bg-success bg-opacity-25 text-success' : 'bg-secondary bg-opacity-25 text-secondary'} border-0`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="text-end px-3">
                            <button 
                              onClick={() => handleDeleteSpot(s.id)} 
                              className="btn btn-sm btn-light text-danger fw-bold border" 
                              style={{ padding: '2px 8px', fontSize: 11 }}
                            >
                              ✕ Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {zoneSpots.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-5 text-muted small">
                            No spots created in this zone yet.<br/>Create one using the form.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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

