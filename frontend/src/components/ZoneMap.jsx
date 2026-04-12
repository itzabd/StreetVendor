import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents, useMap, Polygon } from 'react-leaflet';
import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Ray-casting point-in-polygon algorithm
function isPointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) return true; // No boundary = allow anywhere
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Create a compact dot icon for spot markers (avoids overlap)
function createSpotIcon(status, isSelected, isLocked, customColor) {
  const color = isSelected ? '#7c3aed' : (customColor || (status === 'available' ? '#16a34a' : status === 'occupied' ? '#dc2626' : '#d97706'));
  const ring = isSelected ? `box-shadow:0 0 0 3px #fff,0 0 0 5px ${color};` : 'box-shadow:0 1px 4px rgba(0,0,0,0.4);';
  const pulse = isLocked ? `
    @keyframes sv-marker-pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.7); }
      70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(124, 58, 237, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
    }
    animation: sv-marker-pulse 2s infinite;
  ` : '';

  return L.divIcon({
    className: '',
    html: `<div style="background:${color};border-radius:50%;width:22px;height:22px;border:3px solid #fff;${ring}cursor:pointer;${pulse}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
    tooltipAnchor: [0, -16],
  });
}

// Component for capturing click events — enforces boundary if provided
function LocationPicker({ onPick, boundary, onBoundaryViolation }) {
  useMapEvents({
    click(e) {
      if (!onPick) return;
      const pt = [e.latlng.lat, e.latlng.lng];
      if (boundary && boundary.length >= 3 && !isPointInPolygon(pt, boundary)) {
        if (onBoundaryViolation) onBoundaryViolation();
        return;
      }
      onPick(pt);
    }
  });
  return null;
}

// Component to dynamically pan the map when center changes
function MapCenterer({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      // Use explicit zoom if provided, otherwise keep current zoom
      const z = (zoom != null) ? zoom : map.getZoom();
      map.flyTo(center, z, { animate: true, duration: 0.8 });
    }
  }, [center, zoom]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/**
 * ZoneMap Component
 * Props:
 *   - zones: array of zone objects with optional boundary_geojson
 *   - selectedPolygon: [lat, lng] pairs for polygon being drawn
 *   - spotMarkers: array of spot objects { id, spot_number, latitude, longitude, status }
 *   - boundary: [lat, lng] array to restrict click-picking inside a zone polygon
 *   - onPick(point): called when admin clicks map
 *   - onClearPick(): clear drafted polygon
 *   - onUndoPick(): undo last drafted point
 *   - viewOnly: if true, disables click picking
 *   - height: CSS height string (default '400px')
 *   - center: [lat, lng] override (default Dhaka)
 */
export default function ZoneMap({
  zones = [],
  selectedPolygon = [],
  spotMarkers = [],
  boundary = null,
  onPick,
  onClearPick,
  onUndoPick,
  onSpotSelect,
  selectedSpotId = null,
  viewOnly = false,
  height = '400px',
  center,
  zoom = null,
  locked = false
}) {
  const defaultCenter = center || [23.8103, 90.4125];
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [boundaryWarning, setBoundaryWarning] = useState(false);

  useEffect(() => {
    if (center && center[0] && center[1]) setMapCenter(center);
  }, [center]);

  useEffect(() => {
    if (selectedPolygon.length > 0) setMapCenter(selectedPolygon[0]);
  }, [selectedPolygon]);

  function handleBoundaryViolation() {
    setBoundaryWarning(true);
    setTimeout(() => setBoundaryWarning(false), 2000);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.slice(0, 4));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearchResultPick(result) {
    setMapCenter([parseFloat(result.lat), parseFloat(result.lon)]);
    setSearchResults([]);
    setSearchQuery('');
  }

  return (
    <div style={{ height, borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

      {/* Search bar — admin only */}
      {!viewOnly && !locked && (
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, width: 280, background: '#fff', padding: 8, borderRadius: 10, boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
          <div className="d-flex gap-2">
            <input
              type="text" className="form-control form-control-sm" placeholder="Search area (e.g., Gulshan)"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn btn-sm btn-primary d-flex align-items-center justify-content-center" onClick={handleSearch} disabled={isSearching} style={{ width: 40 }}>
              {isSearching ? <span className="spinner-border spinner-border-sm"></span> : '🔍'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="list-group mt-2 shadow-sm rounded" style={{ maxHeight: 200, overflowY: 'auto' }}>
              {searchResults.map((r, i) => (
                <button key={i} className="list-group-item list-group-item-action py-2 px-2 border-0 border-bottom" style={{ fontSize: 11, background: '#f8fafc' }} onClick={() => handleSearchResultPick(r)}>
                  <div className="fw-semibold text-truncate">{r.display_name.split(',')[0]}</div>
                  <div className="text-muted text-truncate" style={{ fontSize: 10 }}>{r.display_name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Boundary warning toast */}
      {boundaryWarning && (
        <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#dc2626', color: '#fff', padding: '8px 18px', borderRadius: 20, fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          ⚠️ Please click inside the zone boundary!
        </div>
      )}

      {/* Modern Overlay Gradient (only if locked) */}
      {locked && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 400, pointerEvents: 'none', background: 'radial-gradient(circle at center, transparent 30%, rgba(30, 41, 59, 0.05) 100%)' }}></div>
      )}

      {/* Spot legend for vendor view */}
      {viewOnly && !locked && spotMarkers.length > 0 && (
        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1000, background: '#fff', padding: '8px 12px', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.15)', fontSize: 12 }}>
          <div className="fw-semibold mb-1 text-muted" style={{ fontSize: 11 }}>SPOT STATUS</div>
          <div className="d-flex flex-column gap-1">
            <span style={{ color: '#475569' }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#16a34a', marginRight: 4 }}></span>Good</span>
            <span style={{ color: '#475569' }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#d97706', marginRight: 4 }}></span>Reasonable</span>
            <span style={{ color: '#475569' }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#dc2626', marginRight: 4 }}></span>Bad</span>
          </div>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, filter: locked ? 'saturate(0.8) contrast(1.05)' : 'none' }}>
        <MapContainer
          center={mapCenter}
          zoom={locked ? 18 : 14}
          style={{ height: '100%', width: '100%' }}
          dragging={!locked}
          scrollWheelZoom={!locked}
          doubleClickZoom={!locked}
          touchZoom={!locked}
          zoomControl={!locked}
          attributionControl={!locked}
        >
          <MapCenterer center={mapCenter} zoom={locked ? 18 : (zoom ?? null)} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Admin click-to-pick */}
          {!viewOnly && onPick && (
            <LocationPicker
              onPick={onPick}
              boundary={boundary}
              onBoundaryViolation={handleBoundaryViolation}
            />
          )}

          {/* Selected Polygon / spot pin being drafted */}
          {selectedPolygon && selectedPolygon.length > 0 && (
            <>
              {selectedPolygon.map((p, i) => (
                <Marker key={`draft-${i}`} position={p}>
                  <Popup>📍 Point {i + 1}</Popup>
                </Marker>
              ))}
              {selectedPolygon.length > 2 && (
                <Polygon positions={selectedPolygon} color="#1a6b3c" fillColor="#1a6b3c" fillOpacity={0.25} />
              )}
              {selectedPolygon.length === 2 && (
                <Polygon positions={selectedPolygon} color="#1a6b3c" dashArray="5, 10" />
              )}
            </>
          )}

          {/* Existing zone polygons */}
          {zones.map((zone, i) => {
            const geo = zone.boundary_geojson && (typeof zone.boundary_geojson === 'string' ? JSON.parse(zone.boundary_geojson) : zone.boundary_geojson);
            const isArray = Array.isArray(geo);
            const hasPolygon = isArray && geo.length > 2;
            const hasSinglePoint = isArray && geo.length === 1;
            const hasLegacyPoint = zone.latitude && zone.longitude;

            if (!hasPolygon && !hasSinglePoint && !hasLegacyPoint) return null;

            // When picking a spot pin, make polygons non-interactive so clicks pass through
            const polyInteractive = !onPick;
            return (
              <div key={`zone-wrapper-${i}`}>
                {hasPolygon ? (
                  <Polygon
                    positions={geo}
                    color="#3b82f6"
                    fillColor="#3b82f6"
                    fillOpacity={0.12}
                    weight={2}
                    interactive={polyInteractive}
                    pathOptions={{ pointerEvents: polyInteractive ? 'auto' : 'none' }}
                  >
                    {polyInteractive && (
                      <Popup>
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#1a6b3c' }}>🗺️ {zone.name}</div>
                        {zone.area && <div style={{ fontSize: '12px', color: '#64748b' }}>{zone.area}</div>}
                      </Popup>
                    )}
                  </Polygon>
                ) : hasSinglePoint ? (
                  <Marker position={geo[0]}>
                    <Popup><strong>📍 {zone.name}</strong></Popup>
                  </Marker>
                ) : (
                  <Marker position={[zone.latitude, zone.longitude]}>
                    <Popup><strong>📍 {zone.name}</strong></Popup>
                  </Marker>
                )}
              </div>
            );
          })}

          {/* Spot markers with colored status labels */}
          {spotMarkers.map(spot => {
            if (!spot.latitude || !spot.longitude) return null;
            const isSelected = spot.id === selectedSpotId;
            const isAvailable = spot.status === 'available';
            return (
              <Marker
                key={`spot-${spot.id}`}
                position={[parseFloat(spot.latitude), parseFloat(spot.longitude)]}
                icon={createSpotIcon(spot.status, isSelected, locked, spot.displayColor)}
                eventHandlers={onSpotSelect && isAvailable ? {
                  click: (e) => { e.originalEvent.stopPropagation(); onSpotSelect(spot); }
                } : {}}
              >
                <Tooltip permanent direction="top" offset={[0, -12]} opacity={1}
                  className="" pane="tooltipPane"
                >
                  <span style={{
                    background: isSelected ? '#7c3aed' : (spot.displayColor || (spot.status === 'available' ? '#16a34a' : (spot.status === 'unverified' ? '#f59e0b' : '#dc2626'))),
                    color: '#fff', padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                    whiteSpace: 'nowrap', boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                  }}>{spot.business_name || spot.vendor_name || spot.label || spot.spot_number || 'Spot'}</span>
                </Tooltip>
                <Popup>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {spot.is_guest_report ? '📍 ' : '📌 '}
                    {spot.business_name || spot.vendor_name || spot.label || `Spot ${spot.spot_number || ''}`}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{
                      background: isSelected ? '#ede9fe' : (spot.displayColor ? `${spot.displayColor}20` : (spot.status === 'available' ? '#dcfce7' : (spot.status === 'unverified' ? '#fef3c7' : '#fee2e2'))),
                      color: isSelected ? '#6d28d9' : (spot.displayColor || (spot.status === 'available' ? '#15803d' : (spot.status === 'unverified' ? '#b45309' : '#991b1b'))),
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600
                    }}>
                      {isSelected ? '✓ SELECTED' : (spot.status === 'available' ? '🟢 AVAILABLE' : (spot.operating_hours ? `🕒 ${spot.operating_hours.toUpperCase()}` : '🕒 HOURS NOT SPECIFIED'))}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: 6 }}>
                    <div className="fw-bold text-uppercase" style={{ fontSize: 9, letterSpacing: '0.5px' }}>GPS Location</div>
                    <div style={{ fontFamily: 'monospace' }}>📍 {Number(spot.latitude).toFixed(6)}, {Number(spot.longitude).toFixed(6)}</div>
                  </div>
                  {spot.blocks?.block_name && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Block: {spot.blocks.block_name}</div>}
                  {onSpotSelect && (isAvailable || spot.status === 'unverified') && !isSelected && (
                    <button
                      className="btn btn-sm btn-success mt-2 w-100"
                      style={{ fontSize: 11, borderRadius: 6 }}
                      onClick={(e) => { e.stopPropagation(); onSpotSelect(spot); }}
                    >Select This Spot</button>
                  )}
                  {isSelected && (
                    <div style={{ marginTop: 6, fontSize: 11, color: '#6d28d9', fontWeight: 600 }}>✓ This spot is selected!</div>
                  )}
                </Popup>
              </Marker>
            );
          })}

        </MapContainer>
      </div>

      {/* Bottom toolbar — admin zone drawing only */}
      {!viewOnly && onPick && (
        <div className="d-flex justify-content-between align-items-center" style={{ background: '#f0f4f8', padding: '10px 16px', borderTop: '1px solid #e2e8f0', minHeight: 48 }}>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            💡 <strong>Click inside the zone</strong> to pin the spot location.
          </div>
          {selectedPolygon && selectedPolygon.length > 0 && (
            <div className="d-flex gap-2">
              {onUndoPick && (
                <button type="button" onClick={onUndoPick} className="btn btn-sm shadow-sm" style={{ background: '#fef08a', color: '#854d0e', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                  ↩️ Undo Last
                </button>
              )}
              {onClearPick && (
                <button type="button" onClick={onClearPick} className="btn btn-sm shadow-sm" style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                  ❌ Clear Pin
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
