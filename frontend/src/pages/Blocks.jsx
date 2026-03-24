import { useState, useEffect } from 'react';
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
  const { getToken } = useAuth();

  useEffect(() => { 
    loadBlocks(); 
    loadZones(); 
  }, []);

  async function loadBlocks() {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/blocks`, { headers: { Authorization: `Bearer ${token}` } });
    setBlocks(res.data);
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
      await axios.post(`${import.meta.env.VITE_API_URL}/blocks`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ ...formData, block_name: '' }); // keep zone selected
      loadBlocks();
      addToast('Block created successfully', 'success');
    } catch (err) {
      addToast('Failed to create block', 'danger');
    }
  }

  async function handleDelete(id) {
    confirmAction({
      title: 'Delete Block',
      message: 'Are you sure you want to delete this block? It may have assigned spots.',
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
        try {
          const token = await getToken();
          await axios.delete(`${import.meta.env.VITE_API_URL}/blocks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          loadBlocks();
          addToast('Block deleted successfully', 'success');
        } catch (err) {
          addToast(err.response?.data?.error || 'Failed to delete block', 'danger');
        }
      }
    });
  }

  return (
    <div className="p-4">
      <h3 className="fw-bold mb-4">Map Blocks</h3>
      
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title text-primary">Create New Block</h5>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <select className="form-select" value={formData.zone_id} onChange={e => setFormData({...formData, zone_id: e.target.value})} required>
                <option value="">-- Select Zone --</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <input type="text" placeholder="Block Name/Number *" className="form-control" value={formData.block_name} onChange={e => setFormData({...formData, block_name: e.target.value})} required />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100">Add Block</button>
            </div>
          </form>
        </div>
      </div>

      <div className="table-responsive bg-white rounded shadow-sm">
        <table className="table mb-0 table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Block Name</th>
              <th>Parent Zone</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map(b => (
              <tr key={b.id}>
                <td className="fw-semibold">{b.block_name}</td>
                <td><span className="badge bg-light text-dark border">{b.zones?.name}</span></td>
                <td className="text-end">
                  <button onClick={() => handleDelete(b.id)} className="btn btn-sm btn-outline-danger">Delete</button>
                </td>
              </tr>
            ))}
            {blocks.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-muted">No blocks found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
