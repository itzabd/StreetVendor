import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import ZoneMap from '../components/ZoneMap';

export default function Spots() {
  const { addToast } = useToast();
  const { confirmAction } = useConfirm();
  const [spots, setSpots] = useState([]);
  const [zones, setZones] = useState([]);
  
  // Selection state
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedZoneObj, setSelectedZoneObj] = useState(null);
  const [formData, setFormData] = useState({ zone_id: '', spot_number: '', description: '', latitude: null, longitude: null });
  
  const { getToken } = useAuth();

  useEffect(() => { 
    loadSpots(); 
    loadZones(); 
  }, []);

  useEffect(() => {
    if (selectedZone) {
      const z = zones.find(x => x.id === selectedZone);
      if (z) z.boundary_geojson = typeof z.boundary_geojson === 'string' ? JSON.parse(z.boundary_geojson) : z.boundary_geojson;
      setSelectedZoneObj(z || null);
      setFormData(prev => ({ ...prev, zone_id: selectedZone }));
    } else {
      setSelectedZoneObj(null);
    }
  }, [selectedZone, zones]);

  async function loadSpots() {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/spots`, { headers: { Authorization: `Bearer ${token}` } });
    setSpots(res.data);
  }

  async function loadZones() {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
    setZones(res.data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/spots`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ ...formData, spot_number: '', description: '', latitude: null, longitude: null }); 
      loadSpots();
      addToast('Spot created successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create spot', 'danger');
    }
  }

  async function handleDelete(id) {
    confirmAction({
      title: 'Delete Spot',
      message: 'Are you sure you want to delete this spot? This action cannot be undone.',
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
        try {
          const token = await getToken();
          await axios.delete(`${import.meta.env.VITE_API_URL}/spots/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          loadSpots();
          addToast('Spot deleted successfully', 'success');
        } catch (err) {
          addToast(err.response?.data?.error || 'Failed to delete spot', 'danger');
        }
      }
    });
  }

  const getStatusBadge = (status) => {
    const colors = { available: 'success', occupied: 'danger', reserved: 'warning' };
    return <span className={`badge bg-${colors[status] || 'secondary'}`}>{status}</span>;
  };

  return (
    <div className="p-4 animate-entrance">
      <h3 className="fw-bold mb-4">Vendor Spots Management</h3>
      
      <div className="card shadow-sm mb-4 border-0" style={{ borderRadius: 20 }}>
        <div className="card-body p-4">
          <h5 className="card-title text-primary fw-bold mb-4">Create New Spot</h5>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <label className="form-label small fw-bold">Select Zone</label>
              <select className="form-select" value={selectedZone} onChange={e => setSelectedZone(e.target.value)}>
                <option value="">-- Choose Vending Zone --</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-bold">Spot UI/Number *</label>
              <input type="text" placeholder="e.g. GB-101" className="form-control" value={formData.spot_number} onChange={e => setFormData({...formData, spot_number: e.target.value})} required />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-bold">Description</label>
              <input type="text" placeholder="Near main gate, etc." className="form-control" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button 
                type="submit" 
                className="btn btn-primary w-100 py-2 shadow-sm fw-bold" 
                disabled={!selectedZone || (selectedZoneObj && !formData.latitude)}
                style={{ borderRadius: 10 }}
              >Add Spot</button>
            </div>
            
            {selectedZoneObj && (
              <div className="col-12 mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label text-primary fw-bold mb-0">📍 Pinpoint Spot Location on Map</label>
                  <span className="small text-muted border px-3 py-1 bg-light rounded-pill shadow-sm">
                    {formData.latitude ? `Selected: [${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}]` : 'Click on map to select location'}
                  </span>
                </div>
                <div className="small text-muted mb-3">Click inside the <b>{selectedZoneObj.name}</b> boundaries to set the exact GPS location.</div>
                <ZoneMap 
                  viewOnly={false}
                  zones={[selectedZoneObj]} 
                  selectedPolygon={formData.latitude ? [[formData.latitude, formData.longitude]] : []}
                  onPick={(pt) => setFormData({...formData, latitude: pt[0], longitude: pt[1]})}
                  onClearPick={() => setFormData({...formData, latitude: null, longitude: null})}
                  boundary={Array.isArray(selectedZoneObj.boundary_geojson) && selectedZoneObj.boundary_geojson.length >= 3 ? selectedZoneObj.boundary_geojson : null}
                  center={selectedZoneObj.boundary_geojson?.[0] || null}
                  height="340px"
                />
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="table-responsive bg-white rounded shadow-sm border-0" style={{ borderRadius: 20 }}>
        <table className="table mb-0 table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th className="px-4">Spot Identity</th>
              <th>Assigned Zone</th>
              <th>Status</th>
              <th>Description</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {spots.map(s => (
              <tr key={s.id}>
                <td className="fw-bold text-monospace px-4">
                  {s.spot_number}
                  {s.latitude && s.longitude && (
                    <div className="small text-primary mt-1" style={{ fontSize: 10, fontWeight: 400 }}>📍 {Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)}</div>
                  )}
                </td>
                <td>
                  <span className="badge bg-light text-primary border">{s.zones?.name || 'Unassigned'}</span>
                </td>
                <td>{getStatusBadge(s.status)}</td>
                <td className="text-muted small">{s.description || '—'}</td>
                <td className="text-end px-4">
                  <button onClick={() => handleDelete(s.id)} className="btn btn-sm btn-outline-danger px-3" disabled={s.status === 'occupied'} style={{ borderRadius: 8 }}>Delete</button>
                </td>
              </tr>
            ))}
            {spots.length === 0 && <tr><td colSpan="5" className="text-center py-5 text-muted">No spots created yet. Fill the form above to start.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
