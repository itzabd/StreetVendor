import { useState, useEffect, useCallback } from 'react';
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

  const loadZones = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
      const parsedZones = (res.data || []).map(z => {
        if (typeof z.boundary_geojson === 'string') {
          try { 
            z.boundary_geojson = JSON.parse(z.boundary_geojson); 
          } catch { 
            z.boundary_geojson = [];
          }
        }
        return z;
      });
      setZones(parsedZones);
    } catch {
      addToast('Failed to load municipal zones', 'danger');
    }
  }, [getToken, addToast]);

  useEffect(() => { 
    loadZones(); 
  }, [loadZones]);

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
      addToast(`Focused map view on ${z.name}`, 'info');
    } else if (z.latitude && z.longitude) {
      setMapCenterOverride([z.latitude, z.longitude]);
      addToast(`Focused map view on ${z.name}`, 'info');
    } else {
      addToast('This zone does not have coordinates mapped.', 'warning');
    }
  }

  // --- SPOT MANAGEMENT LOGIC ---
  async function loadZoneSpots(zoneId) {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/spots?zone_id=${zoneId}`, { headers: { Authorization: `Bearer ${token}` } });
      setZoneSpots(res.data || []);
    } catch {
      addToast('Failed to load zone spots', 'danger');
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
      addToast('Spatial spot demarcated successfully', 'success');
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
      title: 'Delete Spatial Spot',
      message: 'Are you sure you want to remove this demarcated spot from the municipal registry?',
      confirmText: 'Yes, Remove Spot',
      onConfirm: async () => {
        try {
          const token = await getToken();
          await axios.delete(`${import.meta.env.VITE_API_URL}/spots/${spotId}`, { headers: { Authorization: `Bearer ${token}` } });
          addToast('Spot removed from registry', 'success');
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
      return addToast('A zone boundary requires 1 coordinate for a pinpoint, or 3+ coordinates for a polygon boundary.', 'warning');
    }
    setLoading(true);
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/zones`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ name: '', area: '', description: '', boundary_geojson: [] });
      setMapCenterOverride(null);
      loadZones();
      addToast('Spatial trade zone gazetted successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create zone', 'danger');
    } finally { 
      setLoading(false); 
    }
  }

  async function handleDelete(id) {
    confirmAction({
      title: 'Revoke Spatial Zone',
      message: 'Revoke this spatial zone? All micro-blocks and mapped vending spots within this boundary will be removed.',
      confirmText: 'Yes, Revoke Zone',
      onConfirm: async () => {
        try {
          const token = await getToken();
          await axios.delete(`${import.meta.env.VITE_API_URL}/zones/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          loadZones();
          addToast('Zone revoked successfully', 'success');
          if (formData.boundary_geojson.length > 0) setMapCenterOverride([23.8103, 90.4125]);
        } catch (err) {
          addToast(err.response?.data?.error || 'Failed to delete zone. Active merchant assignments exist.', 'danger');
        }
      }
    });
  }

  return (
    <div className="animate-entrance" style={{ maxWidth: 1440, margin: '0 auto', paddingBottom: '48px' }}>
      {/* Civic Page Header */}
      <div className="sv-page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="apple-pill-badge" style={{ background: 'var(--sv-primary-light)', color: 'var(--sv-primary)', border: '1px solid var(--sv-primary-border)' }}>
              🏛️ Municipal Demarcation Desk
            </span>
            <span className="apple-pill-badge" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.25)' }}>
              Live GIS Mapper
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>
            Geographic Spatial Zones
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--sv-text-muted)', margin: '4px 0 0' }}>
            Gazetted metropolitan trading areas, GIS polygon perimeters, and localized pedestrian corridors.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="apple-card px-3 py-2 text-center" style={{ minWidth: 110 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--sv-text-subtle)', textTransform: 'uppercase' }}>Active Zones</div>
            <div className="sv-mono-data" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--sv-primary)' }}>{zones.length}</div>
          </div>
        </div>
      </div>

      {/* Apple-Grade Interactive Cartographic Workspace */}
      <div className="apple-card mb-4" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{
          padding: '12px 18px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderBottom: '1px solid var(--sv-border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--sv-text-primary)' }}>
              🗺️ Dhaka Metropolitan Spatial Grid
            </span>
            <span className="sv-badge sv-badge-outline" style={{ fontSize: '11px' }}>
              Leaflet Real-Time Layer
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            {formData.boundary_geojson.length > 0 && (
              <>
                <span className="sv-mono-data" style={{ fontSize: '12px', color: 'var(--sv-primary)', fontWeight: 600 }}>
                  Points Picked: {formData.boundary_geojson.length}
                </span>
                <button 
                  type="button" 
                  onClick={handleUndoPick}
                  className="apple-pill-btn"
                  style={{ background: 'var(--sv-surface-subtle)', color: 'var(--sv-text-body)', border: '1px solid var(--sv-border)', padding: '4px 12px', fontSize: '12px' }}
                >
                  ↩ Undo Point
                </button>
                <button 
                  type="button" 
                  onClick={handleClearPick}
                  className="apple-pill-btn"
                  style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '4px 12px', fontSize: '12px' }}
                >
                  ✕ Clear
                </button>
              </>
            )}
          </div>
        </div>

        <ZoneMap 
          zones={zones} 
          selectedPolygon={formData.boundary_geojson} 
          onPick={handleMapPick} 
          onClearPick={handleClearPick}
          onUndoPick={handleUndoPick}
          height="460px"
          center={mapCenterOverride}
        />

        <div style={{
          padding: '10px 18px',
          background: 'var(--sv-surface-subtle)',
          fontSize: '12px',
          color: 'var(--sv-text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--sv-border-subtle)'
        }}>
          <span>
            💡 <strong>GIS Guide:</strong> Click once on empty map canvas to plot a point. Draw 3+ nodes to form a spatial zone polygon.
          </span>
          <span className="sv-mono-data" style={{ fontSize: '11px' }}>
            Datum: EPSG:4326 (WGS84)
          </span>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Create Zone Form Card */}
        <div className="col-lg-5">
          <div className="apple-card h-100 p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
                + Gazetting New Zone
              </h4>
              <span className="sv-badge sv-badge-primary" style={{ fontSize: '10px' }}>
                CIVIC RECORD
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  Zone Legal Designation *
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Mirpur Section-10 Trade Plaza"
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  required 
                />
              </div>

              <div className="mb-3">
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  Municipal Jurisdiction / Borough
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Dhaka North City Corporation (DNCC)"
                  value={formData.area} 
                  onChange={e => setFormData({ ...formData, area: e.target.value })} 
                />
              </div>

              <div className="mb-3">
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  Demarcation Description
                </label>
                <textarea 
                  rows="2" 
                  className="form-control" 
                  placeholder="Boundaries, pedestrian corridors, permitted trade types..."
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div style={{
                padding: '14px',
                borderRadius: 'var(--sv-radius)',
                background: 'var(--sv-surface-subtle)',
                border: '1px solid var(--sv-border)',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Boundary Perimeter Status
                </div>
                {formData.boundary_geojson.length > 0 ? (
                  <div className="sv-mono-data" style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--sv-primary)' }}>
                    ✓ {formData.boundary_geojson.length === 1 ? '1-Node Point Pin' : `${formData.boundary_geojson.length}-Node Boundary Polygon`} plotted.
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--sv-text-subtle)' }}>
                    No points plotted. Click the map above to demarcate the perimeter.
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-100" 
                style={{ padding: '10px' }} 
                disabled={loading}
              >
                {loading ? 'Registering Zone...' : 'Gazette Spatial Zone'}
              </button>
            </form>
          </div>
        </div>

        {/* Zones Registry Ledger Table */}
        <div className="col-lg-7">
          <div className="apple-card h-100 p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
                Gazetted Municipal Zones ({zones.length})
              </h4>
              <span className="sv-mono-data" style={{ fontSize: '11px', color: 'var(--sv-text-subtle)' }}>
                CITY RECORD
              </span>
            </div>

            <div className="table-responsive" style={{ maxHeight: '430px', overflowY: 'auto' }}>
              <table className="sv-table mb-0">
                <thead>
                  <tr>
                    <th>Zone & Jurisdiction</th>
                    <th>Coordinates</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map(z => (
                    <tr key={z.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--sv-text-primary)' }}>{z.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
                          {z.area || z.description || 'General Trading Perimeter'}
                        </div>
                      </td>
                      <td>
                        {Array.isArray(z.boundary_geojson) && z.boundary_geojson.length > 0 ? (
                          <span className="apple-pill-badge" style={{ background: 'var(--sv-primary-light)', color: 'var(--sv-primary)', border: '1px solid var(--sv-primary-border)', fontFamily: 'var(--sv-font-mono)' }}>
                            {z.boundary_geojson.length === 1 ? '1-Node Point' : `${z.boundary_geojson.length}-Point Polygon`}
                          </span>
                        ) : z.latitude ? (
                          <span className="sv-mono-data" style={{ fontSize: '11.5px', color: 'var(--sv-text-secondary)' }}>
                            {z.latitude.toFixed(3)}, {z.longitude.toFixed(3)}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--sv-text-subtle)' }}>—</span>
                        )}
                      </td>
                      <td className="text-end text-nowrap">
                        <button 
                          onClick={() => handlePanToZone(z)} 
                          className="btn btn-sm btn-outline-dark me-2" 
                          style={{ padding: '4px 10px', fontSize: '11.5px' }}
                          title="Locate on Map"
                        >
                          📍 Locate
                        </button>
                        <button 
                          onClick={() => handleManageSpots(z)} 
                          className="btn btn-sm btn-primary me-2" 
                          style={{ padding: '4px 10px', fontSize: '11.5px' }}
                          title="Manage Demarcated Spots"
                        >
                          ⚙️ Spots
                        </button>
                        <button 
                          onClick={() => handleDelete(z.id)} 
                          className="btn btn-sm" 
                          style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '4px 8px', fontSize: '11.5px' }}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                  {zones.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-5" style={{ color: 'var(--sv-text-subtle)' }}>
                        No spatial zones gazetted yet. Plot coordinates to establish your first trading zone.
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
        <div id="spot-manager-panel" className="apple-card mb-4 mt-3 p-4" style={{ border: '2px solid var(--sv-primary-border)' }}>
          <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--sv-primary)', textTransform: 'uppercase' }}>
                SPATIAL SUB-ALLOCATION
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '2px 0 0', color: 'var(--sv-text-primary)' }}>
                📍 Demarcated Spots within {activeZoneForSpots.name}
              </h3>
            </div>
            <button 
              onClick={handleCloseSpots} 
              className="apple-pill-btn"
              style={{ background: 'var(--sv-surface-subtle)', border: '1px solid var(--sv-border)', color: 'var(--sv-text-secondary)', padding: '6px 14px' }}
            >
              ✕ Close Panel
            </button>
          </div>

          <div className="row g-4">
            {/* Interactive Spot Map */}
            <div className="col-12">
              <div style={{
                padding: '16px',
                borderRadius: 'var(--sv-radius-lg)',
                background: 'var(--sv-surface-subtle)',
                border: '1px solid var(--sv-border)'
              }}>
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sv-text-primary)' }}>
                    Step 1: Click Exact Footprint to Drop Spot Pin
                  </div>
                  <div className="sv-mono-data" style={{ fontSize: '12px' }}>
                    {newSpot.latitude ? (
                      <span className="apple-pill-badge" style={{ background: 'rgba(5, 150, 105, 0.12)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.25)' }}>
                        ✓ Pin: {newSpot.latitude.toFixed(5)}, {newSpot.longitude.toFixed(5)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--sv-text-subtle)' }}>⚠️ Click within zone boundary to place pinpoint</span>
                    )}
                  </div>
                </div>
                <div style={{ height: '360px', borderRadius: 'var(--sv-radius)', overflow: 'hidden', border: '1px solid var(--sv-border)' }}>
                  <ZoneMap
                    zones={[activeZoneForSpots]}
                    spotMarkers={zoneSpots}
                    boundary={activeZoneForSpots.boundary_geojson}
                    selectedPolygon={newSpot.latitude ? [[newSpot.latitude, newSpot.longitude]] : []}
                    onPick={(pt) => setNewSpot(s => ({ ...s, latitude: pt[0], longitude: pt[1] }))}
                    height="360px"
                    center={Array.isArray(activeZoneForSpots.boundary_geojson) && activeZoneForSpots.boundary_geojson.length > 0 ? activeZoneForSpots.boundary_geojson[0] : [activeZoneForSpots.latitude || 23.8103, activeZoneForSpots.longitude || 90.4125]}
                  />
                </div>
              </div>
            </div>

            {/* Create Spot Form */}
            <div className="col-md-5">
              <div className="apple-card p-4" style={{ background: '#FFFFFF' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--sv-text-primary)' }}>
                  Step 2: Assign Spot Designation
                </h5>
                <form onSubmit={handleAddSpot}>
                  <div className="mb-3">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                      Spot Number / Municipal ID *
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newSpot.spot_number} 
                      onChange={e => setNewSpot({ ...newSpot, spot_number: e.target.value })} 
                      required 
                      placeholder="e.g. M10-06, KB-14"
                    />
                  </div>
                  <div className="mb-3">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                      Micro-Location Description
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newSpot.description} 
                      onChange={e => setNewSpot({ ...newSpot, description: e.target.value })} 
                      placeholder="e.g. Pavement curve next to pedestrian walkway"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100" 
                    disabled={spotLoading || !newSpot.latitude}
                    style={{ padding: '9px' }}
                  >
                    {spotLoading ? 'Allocating...' : '+ Gazette Spot at Coordinates'}
                  </button>
                  {!newSpot.latitude && (
                    <div style={{ fontSize: '11.5px', color: 'var(--sv-text-subtle)', textAlign: 'center', marginTop: '6px' }}>
                      Pinpoint spot location on map first
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Existing Spots Table */}
            <div className="col-md-7">
              <div className="apple-card p-4 h-100" style={{ background: '#FFFFFF' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
                    Active Allocated Spots ({zoneSpots.length})
                  </h5>
                  <span className="sv-badge sv-badge-outline" style={{ fontSize: '10px' }}>
                    MICRO-PINS
                  </span>
                </div>
                <div className="table-responsive" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  <table className="sv-table mb-0">
                    <thead>
                      <tr>
                        <th>Spot ID</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zoneSpots.map(s => (
                        <tr key={s.id}>
                          <td className="sv-mono-data" style={{ fontWeight: 700 }}>{s.spot_number}</td>
                          <td style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>{s.description || '—'}</td>
                          <td>
                            <span className={`apple-pill-badge ${s.status === 'available' ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <button 
                              onClick={() => handleDeleteSpot(s.id)} 
                              className="btn btn-sm" 
                              style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '2px 8px', fontSize: '11px' }}
                            >
                              ✕ Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                      {zoneSpots.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-muted small">
                            No spots demarcated in this zone yet.
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
      )}
    </div>
  );
}
