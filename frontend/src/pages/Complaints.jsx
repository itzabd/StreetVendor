import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [formData, setFormData] = useState({ subject: '', description: '' });
  const [replyData, setReplyData] = useState({ id: null, status: '', admin_response: '' });
  const [loading, setLoading] = useState(false);
  
  const { profile, getToken } = useAuth();
  const { addToast } = useToast();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => { loadComplaints(); }, []);

  async function loadComplaints() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/complaints`, { headers: { Authorization: `Bearer ${token}` } });
      setComplaints(res.data);
    } catch (err) {
      addToast('Failed to load complaints', 'danger');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/complaints`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ subject: '', description: '' });
      loadComplaints();
      addToast('Complaint submitted successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to submit complaint', 'danger');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminReply(e) {
    e.preventDefault();
    try {
      const token = await getToken();
      await axios.put(`${import.meta.env.VITE_API_URL}/complaints/${replyData.id}`, { status: replyData.status, admin_response: replyData.admin_response }, { headers: { Authorization: `Bearer ${token}` } });
      setReplyData({ id: null, status: '', admin_response: '' });
      loadComplaints();
      addToast('Complaint status updated', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update complaint', 'danger');
    }
  }

  const getStatusBadge = (status) => {
    const colors = { open: 'danger', in_review: 'warning', resolved: 'success', closed: 'secondary' };
    const text = status.replace('_', ' ').toUpperCase();
    return <span className={`badge bg-${colors[status]} px-3 py-2 rounded-pill`} style={{ fontSize: 11 }}>{text}</span>;
  };

  return (
    <div className="p-4 animate-entrance" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="sv-page-header mb-4">
        <h3>{isAdmin ? '📣 Support Inbox' : '📨 My Complaints'}</h3>
        <p>{isAdmin ? 'Manage and resolve vendor issues.' : 'Report issues or disputes to the administration.'}</p>
      </div>
      
      {!isAdmin && (
        <div className="sv-card mb-5">
          <div className="sv-card-header d-flex align-items-center gap-2">
            <span className="fs-5">🚨</span>
            <h5 className="mb-0 text-danger fw-bold">File a New Complaint</h5>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-12">
                <label className="form-label small fw-semibold">Subject</label>
                <input type="text" placeholder="e.g., Harassment, Spot dispute..." className="form-control bg-light" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required />
              </div>
              <div className="col-12">
                <label className="form-label small fw-semibold">Description</label>
                <textarea rows="4" placeholder="Please describe the issue in as much detail as possible..." className="form-control bg-light" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
              </div>
              <div className="col-12 text-end mt-4">
                <button type="submit" className="btn btn-danger px-5" disabled={loading} style={{ borderRadius: 8 }}>
                  {loading ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h5 className="fw-bold mb-3">{isAdmin ? 'All Tickets' : 'My Ticket History'}</h5>
      <div className="d-flex flex-column gap-3">
        {complaints.length === 0 ? (
          <div className="text-center text-muted py-5 sv-card bg-light border-0 shadow-none">No complaints found.</div>
        ) : complaints.map(c => (
          <div key={c.id} className="sv-card position-relative overflow-hidden">
            {/* Status indicator line */}
            <div className={`position-absolute top-0 bottom-0 start-0`} style={{ width: 4, background: c.status === 'resolved' ? '#10b981' : c.status === 'open' ? '#ef4444' : '#f59e0b' }}></div>
            
            <div className="card-body p-4 ms-2">
              <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-3">
                <div>
                  <h5 className="fw-bold mb-1 text-dark">{c.subject}</h5>
                  <div className="small text-muted">
                    {isAdmin ? (
                      <>From: <span className="fw-semibold text-primary">{c.profiles?.full_name}</span> • {new Date(c.created_at).toLocaleString()}</>
                    ) : (
                      <>Submitted on {new Date(c.created_at).toLocaleString()}</>
                    )}
                  </div>
                </div>
                {getStatusBadge(c.status)}
              </div>
              
              <div className="p-3 rounded-3 mb-3" style={{ background: '#f8fafc', color: '#334155', fontSize: 14, border: '1px solid #e2e8f0' }}>
                {c.description}
              </div>

              {c.admin_response && (
                <div className="d-flex gap-3 p-3 rounded-3 mt-3 align-items-start" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div className="fs-3">🛡️</div>
                  <div>
                    <div className="fw-bold text-success mb-1" style={{ fontSize: 13 }}>Admin Response</div>
                    <div style={{ color: '#166534', fontSize: 14 }}>{c.admin_response}</div>
                  </div>
                </div>
              )}

              {isAdmin && replyData.id !== c.id && c.status !== 'closed' && (
                <div className="text-end mt-3">
                  <button onClick={() => setReplyData({ id: c.id, status: c.status, admin_response: c.admin_response || '' })} className="btn btn-sm btn-outline-primary px-4" style={{ borderRadius: 6 }}>
                    Reply / Update Status
                  </button>
                </div>
              )}

              {isAdmin && replyData.id === c.id && (
                <form onSubmit={handleAdminReply} className="mt-4 p-3 rounded-3 shadow-sm border border-primary" style={{ background: '#fff' }}>
                  <h6 className="fw-bold text-primary mb-3">Update Ticket</h6>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label small">Status</label>
                      <select className="form-select" value={replyData.status} onChange={e => setReplyData({...replyData, status: e.target.value})}>
                        <option value="open">Open</option>
                        <option value="in_review">In Review</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div className="col-md-9">
                      <label className="form-label small">Response Message</label>
                      <input type="text" className="form-control" placeholder="Write a response to the vendor..." value={replyData.admin_response} onChange={e => setReplyData({...replyData, admin_response: e.target.value})} />
                    </div>
                    <div className="col-12 d-flex justify-content-end gap-2 mt-3">
                      <button type="button" onClick={() => setReplyData({id: null})} className="btn btn-light px-4">Cancel</button>
                      <button type="submit" className="btn btn-primary px-4">Save Update</button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
