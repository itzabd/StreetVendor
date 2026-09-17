import { useState, useEffect, useCallback, useMemo } from 'react';
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
  
  // Selection & filter state
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedZoneObj, setSelectedZoneObj] = useState(null);
  const [formData, setFormData] = useState({ zone_id: '', spot_number: '', description: '', latitude: null, longitude: null });
  const [submitting, setSubmitting] = useState(false);
  
  const { getToken } = useAuth();

  const loadSpots = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/spots`, { headers: { Authorization: `Bearer ${token}` } });
      setSpots(res.data || []);
    } catch {
      addToast('Failed to load spatial spots', 'danger');
    }
  }, [getToken, addToast]);

  const loadZones = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
      setZones(res.data || []);
    } catch {
      addToast('Failed to load zones for spots', 'danger');
    }
  }, [getToken, addToast]);

  useEffect(() => { 
    loadSpots(); 
    loadZones(); 
  }, [loadSpots, loadZones]);

  useEffect(() => {
    if (selectedZone) {
      const z = zones.find(x => x.id === selectedZone);
      if (z) {
        const copy = { ...z };
        if (typeof copy.boundary_geojson === 'string') {
          try { copy.boundary_geojson = JSON.parse(copy.boundary_geojson); } catch { copy.boundary_geojson = []; }
        }
        setSelectedZoneObj(copy);
      } else {
        setSelectedZoneObj(null);
      }
      setFormData(prev => ({ ...prev, zone_id: selectedZone }));
    } else {
      setSelectedZoneObj(null);
    }
  }, [selectedZone, zones]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/spots`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ zone_id: selectedZone, spot_number: '', description: '', latitude: null, longitude: null }); 
      loadSpots();
      addToast('Spot demarcated and gazetted successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create spot', 'danger');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    confirmAction({
      title: 'Revoke Spatial Spot',
      message: 'Revoke this spatial spot from the municipal registry? This will free any assigned vendor demarcations.',
      confirmText: 'Yes, Revoke Spot',
      onConfirm: async () => {
        try {
          const token = await getToken();
          await axios.delete(`${import.meta.env.VITE_API_URL}/spots/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          loadSpots();
          addToast('Spot revoked from municipal registry', 'success');
        } catch (err) {
          addToast(err.response?.data?.error || 'Failed to delete spot', 'danger');
        }
      }
    });
  }

  const filteredSpots = useMemo(() => {
    return spots.filter(s => {
      const matchZone = selectedZoneFilter === 'all' || s.zone_id === selectedZoneFilter || s.zones?.id === selectedZoneFilter;
      const matchQuery = !searchQuery || 
        (s.spot_number && s.spot_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.zones?.name && s.zones.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchZone && matchQuery;
    });
  }, [spots, selectedZoneFilter, searchQuery]);

  return (
    <div className="animate-entrance" style={{ maxWidth: 1440, margin: '0 auto', paddingBottom: '48px' }}>
      {/* Header */}
      <div className="sv-page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="apple-pill-badge" style={{ background: 'var(--sv-primary-light)', color: 'var(--sv-primary)', border: '1px solid var(--sv-primary-border)' }}>
              📍 Spatial Grid Registry
            </span>
            <span className="apple-pill-badge" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.25)' }}>
              Micro-Demarcations
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>
            Demarcated Trade Spots
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--sv-text-muted)', margin: '4px 0 0' }}>
            GPS-locked individual vending spots, pedestrian pavement clearances, and occupancy records.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="apple-card px-3 py-2 text-center" style={{ minWidth: 120 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--sv-text-subtle)', textTransform: 'uppercase' }}>Total Demarcated</div>
            <div className="sv-mono-data" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--sv-primary)' }}>{spots.length}</div>
          </div>
          <div className="apple-card px-3 py-2 text-center" style={{ minWidth: 120 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--sv-text-subtle)', textTransform: 'uppercase' }}>Available</div>
            <div className="sv-mono-data" style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>
              {spots.filter(s => s.status === 'available').length}
            </div>
          </div>
        </div>
      </div>

      {/* Spot Creation Card */}
      <div className="apple-card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
            + Demarcate New Spatial Vending Spot
          </h4>
          <span className="sv-badge sv-badge-primary" style={{ fontSize: '10.5px' }}>
            GPS COORDINATES
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                Assigned Spatial Zone *
              </label>
              <select 
                className="form-select" 
                value={selectedZone} 
                onChange={e => setSelectedZone(e.target.value)}
                required
              >
                <option value="">-- Choose Vending Zone --</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>

            <div className="col-md-3">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                Spot Municipal Number *
              </label>
              <input 
                type="text" 
                placeholder="e.g. M10-07, KB-09" 
                className="form-control" 
                value={formData.spot_number} 
                onChange={e => setFormData({ ...formData, spot_number: e.target.value })} 
                required 
              />
            </div>

            <div className="col-md-3">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                Pavement / Location Description
              </label>
              <input 
                type="text" 
                placeholder="Near north roundabout pavement edge" 
                className="form-control" 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button 
                type="submit" 
                className="btn btn-primary w-100" 
                disabled={submitting || !selectedZone || (selectedZoneObj && !formData.latitude)}
                style={{ padding: '9px' }}
              >
                {submitting ? 'Registering...' : '+ Demarcate Spot'}
              </button>
            </div>
            
            {selectedZoneObj && (
              <div className="col-12 mt-3 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--sv-text-primary)' }}>
                    📍 Pinpoint GPS Location inside {selectedZoneObj.name}
                  </div>
                  <span className="apple-pill-badge" style={{ 
                    background: formData.latitude ? 'rgba(5, 150, 105, 0.12)' : 'var(--sv-surface-subtle)', 
                    color: formData.latitude ? '#059669' : 'var(--sv-text-muted)',
                    border: '1px solid var(--sv-border)',
                    fontFamily: 'var(--sv-font-mono)',
                    fontSize: '11.5px'
                  }}>
                    {formData.latitude ? `✓ Selected: [${formData.latitude.toFixed(5)}, ${formData.longitude.toFixed(5)}]` : '⚠️ Click inside zone boundary to pin location'}
                  </span>
                </div>
                <div style={{ height: '320px', borderRadius: 'var(--sv-radius)', overflow: 'hidden', border: '1px solid var(--sv-border)' }}>
                  <ZoneMap 
                    viewOnly={false}
                    zones={[selectedZoneObj]} 
                    selectedPolygon={formData.latitude ? [[formData.latitude, formData.longitude]] : []}
                    onPick={(pt) => setFormData(f => ({ ...f, latitude: pt[0], longitude: pt[1] }))}
                    onClearPick={() => setFormData(f => ({ ...f, latitude: null, longitude: null }))}
                    boundary={Array.isArray(selectedZoneObj.boundary_geojson) && selectedZoneObj.boundary_geojson.length >= 3 ? selectedZoneObj.boundary_geojson : null}
                    center={selectedZoneObj.boundary_geojson?.[0] || null}
                    height="320px"
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Directory & Filter Bar */}
      <div className="apple-card p-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
              Demarcated Spots Directory ({filteredSpots.length})
            </h4>
            <div className="apple-segmented-bar">
              <button 
                className={`apple-segmented-item ${selectedZoneFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedZoneFilter('all')}
              >
                All Zones
              </button>
              {zones.map(z => (
                <button 
                  key={z.id} 
                  className={`apple-segmented-item ${selectedZoneFilter === z.id ? 'active' : ''}`}
                  onClick={() => setSelectedZoneFilter(z.id)}
                >
                  {z.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ maxWidth: '280px', width: '100%' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search spots, zones, notes..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ fontSize: '13px', padding: '7px 12px' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="sv-table mb-0">
            <thead>
              <tr>
                <th>Spot Identity</th>
                <th>Assigned Zone</th>
                <th>Status</th>
                <th>Micro-Demarcation Notes</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpots.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="sv-mono-data" style={{ fontWeight: 700, color: 'var(--sv-text-primary)' }}>
                      {s.spot_number}
                    </div>
                    {s.latitude && s.longitude && (
                      <div className="sv-mono-data" style={{ fontSize: '11px', color: 'var(--sv-primary)', marginTop: '2px' }}>
                        📍 {Number(s.latitude).toFixed(4)}, {Number(s.longitude).toFixed(4)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="apple-pill-badge" style={{ background: 'var(--sv-surface-subtle)', color: 'var(--sv-text-secondary)', border: '1px solid var(--sv-border)' }}>
                      {s.zones?.name || 'Metropolitan Grid'}
                    </span>
                  </td>
                  <td>
                    <span className={`apple-pill-badge ${s.status === 'available' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`}>
                      ● {s.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: '12.5px', color: 'var(--sv-text-muted)' }}>
                    {s.description || 'Standard pedestrian perimeter'}
                  </td>
                  <td className="text-end">
                    <button 
                      onClick={() => handleDelete(s.id)} 
                      className="btn btn-sm" 
                      disabled={s.status === 'occupied'}
                      style={{ 
                        background: '#fee2e2', 
                        color: '#991b1b', 
                        border: '1px solid #fecaca', 
                        padding: '4px 10px', 
                        fontSize: '11.5px',
                        opacity: s.status === 'occupied' ? 0.5 : 1 
                      }}
                      title={s.status === 'occupied' ? 'Occupied spot cannot be deleted' : 'Revoke spot'}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSpots.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5" style={{ color: 'var(--sv-text-subtle)' }}>
                    No demarcated spots match your current filter.
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
