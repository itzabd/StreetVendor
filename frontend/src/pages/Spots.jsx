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
  const [blocks, setBlocks] = useState([]);
  
  // Selection state
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedZoneObj, setSelectedZoneObj] = useState(null);
  const [formData, setFormData] = useState({ block_id: '', spot_number: '', description: '', latitude: null, longitude: null });
  
  const { getToken } = useAuth();

  useEffect(() => { 
    loadSpots(); 
    loadZones(); 
  }, []);

  useEffect(() => {
    if (selectedZone) {
      loadBlocksForZone(selectedZone);
      const z = zones.find(x => x.id === selectedZone);
      if (z) z.boundary_geojson = typeof z.boundary_geojson === 'string' ? JSON.parse(z.boundary_geojson) : z.boundary_geojson;
      setSelectedZoneObj(z || null);
    } else {
      setBlocks([]);
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

  async function loadBlocksForZone(zoneId) {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/blocks?zone_id=${zoneId}`, { headers: { Authorization: `Bearer ${token}` } });
    setBlocks(res.data);
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
      addToast('Failed to create spot', 'danger');
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
      <h3 className="fw-bold mb-4">Vendor Spots</h3>
      
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title text-primary">Create New Spot</h5>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-3">
              <select className="form-select" value={selectedZone} onChange={e => { setSelectedZone(e.target.value); setFormData({...formData, block_id: ''}); }}>
                <option value="">-- Select Zone First --</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={formData.block_id} onChange={e => setFormData({...formData, block_id: e.target.value})} required disabled={!selectedZone}>
                <option value="">-- Select Block --</option>
                {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <input type="text" placeholder="Spot UI/Number *" className="form-control" value={formData.spot_number} onChange={e => setFormData({...formData, spot_number: e.target.value})} required />
            </div>
            <div className="col-md-2">
              <input type="text" placeholder="Description" className="form-control" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="col-md-2">
              <button 
                type="submit" 
                className="btn btn-primary w-100" 
                disabled={selectedZoneObj && !formData.latitude}
                title={selectedZoneObj && !formData.latitude ? 'Please pinpoint the spot on the map first' : ''}
              >Add Spot</button>
              {selectedZoneObj && !formData.latitude && (
                <div className="small text-danger mt-1" style={{ fontSize: 11 }}>⚠️ Pin required on map</div>
              )}
            </div>
            
            {selectedZoneObj && (
              <div className="col-12 mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label text-primary fw-bold mb-0">📍 Pinpoint Spot Location on Map</label>
                  <span className="small text-muted border px-2 py-1 bg-light rounded shadow-sm">
                    {formData.latitude ? `Selected: [${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}]` : 'No location selected'}
                  </span>
                </div>
                <div className="small text-muted mb-2">Search the area or click anywhere inside the <b>{selectedZoneObj.name}</b> zone boundaries below to assign exact GPS coordinates to this spot.</div>
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

      <div className="table-responsive bg-white rounded shadow-sm">
        <table className="table mb-0 table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Spot Number</th>
              <th>Block & Zone</th>
              <th>Status</th>
              <th>Description</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {spots.map(s => (
              <tr key={s.id}>
                <td className="fw-semibold text-monospace">
                  {s.spot_number}
                  {s.latitude && s.longitude && (
                    <div className="small text-primary mt-1" style={{ fontSize: 10 }}>📍 [{Number(s.latitude).toFixed(3)}, {Number(s.longitude).toFixed(3)}]</div>
                  )}
                </td>
                <td>
                  <div className="small fw-semibold">{s.blocks?.block_name}</div>
                  <div className="small text-muted">{s.blocks?.zones?.name}</div>
                </td>
                <td>{getStatusBadge(s.status)}</td>
                <td className="text-muted small">{s.description || '-'}</td>
                <td className="text-end">
                  <button onClick={() => handleDelete(s.id)} className="btn btn-sm btn-outline-danger" disabled={s.status === 'occupied'}>Delete</button>
                </td>
              </tr>
            ))}
            {spots.length === 0 && <tr><td colSpan="5" className="text-center py-4 text-muted">No spots found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
