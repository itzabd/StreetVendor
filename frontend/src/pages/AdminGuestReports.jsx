import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ZoneMap from '../components/ZoneMap';

export default function AdminGuestReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]);
  const { getToken } = useAuth();
  const { addToast } = useToast();
  const base = import.meta.env.VITE_API_URL;

  const fetchReports = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${base}/public/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  }, [base, getToken]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const token = await getToken();
      await axios.patch(`${base}/public/reports/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast(`Report ${status} successfully!`, 'success');
      fetchReports();
    } catch {
      addToast('Failed to update report status', 'danger');
    }
  };

  return (
    <div className="animate-entrance">
      <div className="sv-page-header">
        <h3>📍 Guest Identified Vendors</h3>
        <p>Review and approve street vendor spots reported by the public. View them on the map to verify their location.</p>
      </div>

      <div className="sv-card mb-4 p-0 overflow-hidden">
        <ZoneMap 
          viewOnly={true} 
          zones={[]}
          center={mapCenter}
          selectedSpotId={selectedReportId}
          spotMarkers={reports.map(r => ({
            id: r.id,
            latitude: parseFloat(r.latitude),
            longitude: parseFloat(r.longitude),
            label: `${r.vendor_name || 'Spot'} (${r.status})`,
            status: r.status === 'approved' ? 'available' : r.status === 'rejected' ? 'occupied' : 'reserved'
          }))}
          height="350px"
        />
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--sv-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--sv-surface-subtle)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="sv-badge sv-badge-warning">Pending</span>
            <span className="sv-badge sv-badge-success">Approved</span>
            <span className="sv-badge sv-badge-danger">Rejected</span>
          </div>
          <small className="text-muted">Click a row to locate on map.</small>
        </div>
      </div>

      <div className="sv-card">
        <div className="sv-card-header">
          <h5 className="mb-0">All Reports From Public</h5>
        </div>
        <div className="table-responsive">
          <table className="sv-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Category</th>
                <th>Location</th>
                <th>Reporter</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-4">Loading reports...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-4 text-muted">No guest reports found.</td></tr>
              ) : (
                reports.map(r => (
                  <tr 
                    key={r.id} 
                    onClick={() => {
                      setSelectedReportId(r.id);
                      setMapCenter([parseFloat(r.latitude), parseFloat(r.longitude)]);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{ cursor: 'pointer', backgroundColor: selectedReportId === r.id ? 'var(--sv-gray-100)' : 'transparent' }}
                    className={selectedReportId === r.id ? 'border-start border-4 border-warning' : ''}
                  >
                    <td className="fw-bold">{r.vendor_name}</td>
                    <td><span className="badge bg-light text-dark border" style={{fontSize: 10}}>{r.category || 'N/A'}</span></td>
                    <td><small className="text-muted">{parseFloat(r.latitude).toFixed(4)}, {parseFloat(r.longitude).toFixed(4)}</small></td>
                    <td className="small">{r.reported_by_name || 'Guest'}</td>
                    <td style={{ maxWidth: 200, fontSize: 12 }}>{r.comment || '—'}</td>
                    <td>
                      <span className={`sv-badge sv-badge-${r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'danger'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(r.id, 'approved'); }} className="btn btn-sm btn-success">Approve</button>
                          <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(r.id, 'rejected'); }} className="btn btn-sm btn-outline-danger">Reject</button>
                        </div>
                      )}
                      {r.status !== 'pending' && <span className="text-muted small">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
