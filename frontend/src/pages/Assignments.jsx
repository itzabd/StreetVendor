import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

export default function Assignments() {
  const { addToast } = useToast();
  const { confirmAction } = useConfirm();
  const location = useLocation();
  const [assignments, setAssignments] = useState([]);
  const [zones, setZones] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [spots, setSpots] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]); // dropdown list
  const [approvedApps, setApprovedApps] = useState([]); // full data for lookup
  const [pendingSpotNumber, setPendingSpotNumber] = useState(null);
  
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [formData, setFormData] = useState({ 
    vendor_id: '', 
    spot_id: '', 
    start_date: new Date().toISOString().split('T')[0], 
    end_date: '', 
    rent_amount: '' 
  });
  
  const { profile, getToken } = useAuth();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => { 
    loadAssignments(); 
    if (isAdmin) {
      loadZones();
      loadApprovedUsers();
      
      // Auto-pre-fill from Application redirect
      if (location.state) {
        const { vendor_id, zone_id } = location.state;
        if (vendor_id) setFormData(prev => ({ ...prev, vendor_id }));
        if (zone_id) setSelectedZone(zone_id); // This triggers loadBlocksForZone
        addToast('Form pre-filled from application!', 'info');
      }
    }
  }, [isAdmin, location.state]);

  useEffect(() => {
    if (selectedZone) loadBlocksForZone(selectedZone);
    else setBlocks([]);
  }, [selectedZone]);

  // Logic to auto-select block and spot if redirecting from application
  useEffect(() => {
    // If blocks just loaded and we have a target spot
    const targetNum = location.state?.preferred_spot_number || pendingSpotNumber;
    if (blocks.length > 0 && targetNum && !selectedBlock) {
      findAndSelectBlockForSpot(targetNum);
    }
  }, [blocks, pendingSpotNumber, location.state]);

  useEffect(() => {
    if (selectedBlock) loadAvailableSpots(selectedBlock);
    else setSpots([]);
  }, [selectedBlock]);

  useEffect(() => {
    const targetNum = location.state?.preferred_spot_number || pendingSpotNumber;
    if (spots.length > 0 && targetNum && !formData.spot_id) {
      const target = spots.find(s => s.spot_number === targetNum);
      if (target) setFormData(prev => ({ ...prev, spot_id: target.id }));
    }
  }, [spots, pendingSpotNumber]);

  async function loadAvailableSpots(blockId) {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/spots?block_id=${blockId}`, { headers: { Authorization: `Bearer ${token}` } });
    // Only show available spots
    setSpots(res.data.filter(s => s.status === 'available'));
  }

  // Handle Vendor Selection Change (Pull-based automation)
  const handleVendorChange = (vendorId) => {
    setFormData(prev => ({ ...prev, vendor_id: vendorId }));
    if (!vendorId) return;

    // Look for the most recent approved application for this vendor
    const app = approvedApps.find(a => a.vendor_id === vendorId);
    if (app) {
      if (app.zone_id) setSelectedZone(app.zone_id);
      
      let spotNum = null;
      if (app.notes && app.notes.includes('[Preferred Spot:')) {
        const match = app.notes.match(/\[Preferred Spot:\s*([^\]]+)\]/);
        if (match) spotNum = match[1].trim();
      }
      
      setPendingSpotNumber(spotNum);
      addToast(`Found application for ${app.zones?.name}. Auto-filling...`, 'info');
    }
  };

  async function loadAssignments() {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/assignments`, { headers: { Authorization: `Bearer ${token}` } });
    setAssignments(res.data);
  }

  async function loadApprovedUsers() {
    const token = await getToken();
    // Get all approved applications to find eligible vendors
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/applications`, { headers: { Authorization: `Bearer ${token}` } });
    const approved = res.data.filter(a => a.status === 'approved');
    // Deduplicate by vendor_id
    const uniqueVendors = Array.from(new Map(approved.map(a => [a.vendor_id, a.profiles])).values());
    // Note: the backend returns profiles nested inside applications, so a.profiles contains full_name
    // To make this robust, we inject the vendor_id into the profile object for the dropdown
    const mapped = approved.map(a => ({ id: a.vendor_id, name: a.profiles?.full_name, phone: a.profiles?.phone }));
    const unique = Array.from(new Map(mapped.map(item => [item.id, item])).values());
    setApprovedUsers(unique);
    setApprovedApps(approved); // Store full apps for lookup
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

  async function findAndSelectBlockForSpot(spotNum) {
    if (!spotNum) return;
    const token = await getToken();
    
    // Iterate through all blocks in this zone to find the one containing the preferred spot number
    for (const block of blocks) {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/spots?block_id=${block.id}`, { headers: { Authorization: `Bearer ${token}` } });
        const match = res.data.find(s => s.spot_number === spotNum);
        if (match) {
          setSelectedBlock(block.id);
          // The spots useEffect will handle setting the formData.spot_id
          // but we can also set it here for faster response
          setFormData(prev => ({ ...prev, spot_id: match.id }));
          return;
        }
      } catch (err) {
        console.error("Error searching block for spot", err);
      }
    }
    addToast(`Could not find a match for preferred Spot ${spotNum} in this zone's blocks.`, 'warning');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/assignments`, formData, { headers: { Authorization: `Bearer ${token}` } });
      
      // Issue targeted notification
      const allNotifs = JSON.parse(localStorage.getItem('sv_notifications') || '[]');
      allNotifs.unshift({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        target_vendor_id: formData.vendor_id,
        title: 'Spot Assigned 🎉',
        message: 'An administrator has assigned you a new spot on the map.',
        readBy: [],
        created_at: new Date().toISOString()
      });
      localStorage.setItem('sv_notifications', JSON.stringify(allNotifs));

      setFormData({ vendor_id: '', spot_id: '', start_date: new Date().toISOString().split('T')[0], end_date: '', rent_amount: '' });
      setSelectedZone('');
      setSelectedBlock('');
      loadAssignments();
      addToast('Spot assigned successfully!', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to assign spot', 'danger');
    }
  }

  async function handleRevoke(id) {
    confirmAction({
      title: 'Revoke Assignment',
      message: 'Are you sure you want to revoke this assignment and free up the spot?',
      confirmText: 'Yes, Revoke',
      onConfirm: async () => {
        try {
          const token = await getToken();
          await axios.put(`${import.meta.env.VITE_API_URL}/assignments/${id}`, { status: 'revoked', end_date: new Date().toISOString().split('T')[0] }, { headers: { Authorization: `Bearer ${token}` } });
          loadAssignments();
          addToast('Assignment revoked successfully', 'success');
        } catch (err) {
          addToast(err.response?.data?.error || 'Failed to revoke assignment', 'danger');
        }
      }
    });
  }

  const getStatusBadge = (status) => {
    const colors = { active: 'success', ended: 'secondary', revoked: 'danger' };
    return <span className={`badge bg-${colors[status]}`}>{status}</span>;
  };

  return (
    <div className="animate-entrance">
      <h3 className="fw-bold mb-4">{isAdmin ? 'Spot Assignments' : 'My Assigned Spots'}</h3>
      
      {isAdmin && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title text-primary">Assign Spot to Vendor</h5>
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-3">
                <select className="form-select" value={formData.vendor_id} onChange={e => handleVendorChange(e.target.value)} required>
                  <option value="">-- Select Vendor --</option>
                  {approvedUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.phone})</option>)}
                </select>
                <div className="form-text small">Only lists vendors with approved applications</div>
              </div>

              <div className="col-md-2">
                <select className="form-select" value={selectedZone} onChange={e => { setSelectedZone(e.target.value); setSelectedBlock(''); setFormData({...formData, spot_id: ''}); }}>
                  <option value="">- Zone -</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>

              <div className="col-md-2">
                <select className="form-select" value={selectedBlock} onChange={e => { setSelectedBlock(e.target.value); setFormData({...formData, spot_id: ''}); }} disabled={!selectedZone}>
                  <option value="">- Block -</option>
                  {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
                </select>
              </div>

              <div className="col-md-2">
                <select className="form-select" value={formData.spot_id} onChange={e => setFormData({...formData, spot_id: e.target.value})} required disabled={!selectedBlock}>
                  <option value="">- Spot -</option>
                  {spots.map(s => <option key={s.id} value={s.id}>{s.spot_number}</option>)}
                </select>
              </div>

              <div className="col-md-2">
                <input type="date" className="form-control mb-1" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required title="Start Date" />
                <input type="date" className="form-control" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} title="End Date (Optional)" />
              </div>

              <div className="col-md-2">
                <input type="number" step="0.01" className="form-control h-100" placeholder="Rent Amount (৳)" value={formData.rent_amount} onChange={e => setFormData({...formData, rent_amount: e.target.value})} required title="Monthly Rent Amount" />
              </div>

              <div className="col-md-1">
                <button type="submit" className="btn btn-primary w-100 h-100 d-flex align-items-center justify-content-center p-0" style={{ fontSize: 13 }}>Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-responsive bg-white rounded shadow-sm">
        <table className="table mb-0 table-hover align-middle">
          <thead className="table-light">
            <tr>
              {isAdmin && <th>Vendor</th>}
              <th>Location details</th>
              <th>Monthly Rent</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              {isAdmin && <th className="text-end">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id}>
                {isAdmin && (
                  <td>
                    <div className="fw-semibold">{a.profiles?.full_name}</div>
                    <div className="small text-muted">{a.profiles?.phone || 'No phone'}</div>
                  </td>
                )}
                <td>
                  <div className="fw-bold">{a.spots?.spot_number}</div>
                  <div className="small text-muted">{a.spots?.blocks?.block_name}, {a.spots?.blocks?.zones?.name}</div>
                </td>
                <td className="fw-semibold text-success">
                  {a.rent_amount ? `৳${Number(a.rent_amount).toFixed(2)}` : 'N/A'}
                </td>
                <td>{getStatusBadge(a.status)}</td>
                <td className="small">{a.start_date}</td>
                <td className="small">{a.end_date || 'N/A'}</td>
                {isAdmin && (
                  <td className="text-end">
                    {a.status === 'active' && (
                      <button onClick={() => handleRevoke(a.id)} className="btn btn-sm btn-outline-danger">Revoke</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {assignments.length === 0 && <tr><td colSpan={isAdmin ? 6 : 5} className="text-center py-4 text-muted">No assignments found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
