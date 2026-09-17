import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

export default function Blocks() {
  const { addToast } = useToast();
  const { confirmAction } = useConfirm();
  const [blocks, setBlocks] = useState([]);
  const [zones, setZones] = useState([]);
  const [formData, setFormData] = useState({ zone_id: '', block_name: '' });
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const loadBlocks = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/blocks`, { headers: { Authorization: `Bearer ${token}` } });
      setBlocks(res.data || []);
    } catch {
      addToast('Failed to load trade corridor blocks', 'danger');
    }
  }, [getToken, addToast]);

  const loadZones = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
      setZones(res.data || []);
    } catch {
      addToast('Failed to load zones for blocks', 'danger');
    }
  }, [getToken, addToast]);

  useEffect(() => { 
    loadBlocks(); 
    loadZones(); 
  }, [loadBlocks, loadZones]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/blocks`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ ...formData, block_name: '' });
      loadBlocks();
      addToast('Municipal corridor block registered', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create block', 'danger');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    confirmAction({
      title: 'Revoke Corridor Block',
      message: 'Revoke this trade corridor block from the municipal ledger? Sub-assigned spots may be affected.',
      confirmText: 'Yes, Revoke Block',
      onConfirm: async () => {
        try {
          const token = await getToken();
          await axios.delete(`${import.meta.env.VITE_API_URL}/blocks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          loadBlocks();
          addToast('Block removed successfully', 'success');
        } catch (err) {
          addToast(err.response?.data?.error || 'Failed to delete block', 'danger');
        }
      }
    });
  }

  return (
    <div className="animate-entrance" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '48px' }}>
      {/* Civic Page Header */}
      <div className="sv-page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="apple-pill-badge" style={{ background: 'var(--sv-primary-light)', color: 'var(--sv-primary)', border: '1px solid var(--sv-primary-border)' }}>
              🏛️ Municipal Sector Demarcation
            </span>
            <span className="apple-pill-badge" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.25)' }}>
              Corridor Ledger
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>
            Municipal Trade Corridors & Blocks
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--sv-text-muted)', margin: '4px 0 0' }}>
            Intermediate zoning units dividing spatial zones into manageable merchant aisles and market rows.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="apple-card px-3 py-2 text-center" style={{ minWidth: 120 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--sv-text-subtle)', textTransform: 'uppercase' }}>Active Blocks</div>
            <div className="sv-mono-data" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--sv-primary)' }}>{blocks.length}</div>
          </div>
          <div className="apple-card px-3 py-2 text-center" style={{ minWidth: 120 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--sv-text-subtle)', textTransform: 'uppercase' }}>Covered Zones</div>
            <div className="sv-mono-data" style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>
              {new Set(blocks.map(b => b.zone_id)).size}
            </div>
          </div>
        </div>
      </div>

      {/* Creation Card */}
      <div className="apple-card p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
            + Register New Trade Corridor Block
          </h4>
          <span className="sv-badge sv-badge-primary" style={{ fontSize: '10.5px' }}>
            SECTOR ENTRY
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-5">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                Parent Spatial Zone *
              </label>
              <select 
                className="form-select" 
                value={formData.zone_id} 
                onChange={e => setFormData({ ...formData, zone_id: e.target.value })} 
                required
              >
                <option value="">-- Choose Vending Zone --</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            
            <div className="col-md-5">
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                Block Sector Designation / Title *
              </label>
              <input 
                type="text" 
                placeholder="e.g. Block-B West Pavement Corridor" 
                className="form-control" 
                value={formData.block_name} 
                onChange={e => setFormData({ ...formData, block_name: e.target.value })} 
                required 
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button 
                type="submit" 
                className="btn btn-primary w-100" 
                disabled={loading}
                style={{ padding: '9px' }}
              >
                {loading ? 'Adding...' : '+ Add Block'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div className="apple-card p-4">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
            Registered Municipal Blocks ({blocks.length})
          </h4>
          <span className="sv-mono-data" style={{ fontSize: '11px', color: 'var(--sv-text-subtle)' }}>
            DHAKA CIVIC LEDGER
          </span>
        </div>

        <div className="table-responsive">
          <table className="sv-table mb-0">
            <thead>
              <tr>
                <th>Block Designation</th>
                <th>Parent Zone</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map(b => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--sv-text-primary)' }}>{b.block_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--sv-text-subtle)', marginTop: '2px' }}>
                      Sector ID: <span className="sv-mono-data">{b.id?.substring(0, 8)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="apple-pill-badge" style={{ background: 'var(--sv-surface-subtle)', color: 'var(--sv-text-secondary)', border: '1px solid var(--sv-border)' }}>
                      {b.zones?.name || 'Unassigned Zone'}
                    </span>
                  </td>
                  <td className="text-end">
                    <button 
                      onClick={() => handleDelete(b.id)} 
                      className="btn btn-sm"
                      style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '4px 10px', fontSize: '11.5px' }}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
              {blocks.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-5" style={{ color: 'var(--sv-text-subtle)' }}>
                    No blocks established yet. Define a corridor above to organize spatial spots.
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
