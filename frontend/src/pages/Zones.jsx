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
    <div className="p-4" style={{ maxWidth: 1000, margin: '0 auto' }}>
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
    </div>
  );
}
