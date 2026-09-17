import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [formData, setFormData] = useState({ subject: '', description: '' });
  const [replyData, setReplyData] = useState({ id: null, status: '', admin_response: '' });
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState('all');
  
  const { profile, getToken, isDemo } = useAuth();
  const { addToast } = useToast();
  const isAdmin = profile?.role === 'admin';

  const loadComplaints = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/complaints`, { headers: { Authorization: `Bearer ${token}` } });
      let list = res.data || [];
      if (isDemo && list.length === 0) {
        list = [
          {
            id: 'comp-demo-01',
            created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
            subject: 'Unauthorized Pavement Cart Encroachment at Spot M10-04',
            description: 'Unregistered seasonal cart has occupied pedestrian verge adjacent to my permitted tea stall, causing congestion.',
            status: 'in_review',
            profiles: { full_name: 'Rahim Uddin' },
            admin_response: 'DNCC Ward Inspector notified. Site inspection scheduled for tomorrow morning.'
          },
          {
            id: 'comp-demo-02',
            created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
            subject: 'Waste Disposal Bin Overflow in Karwan Bazar Corridor',
            description: 'Municipal waste container requires immediate clearance near spot KB-01 produce stalls.',
            status: 'resolved',
            profiles: { full_name: 'Abdul Malek' },
            admin_response: 'Waste clearance truck dispatched and area sanitized by City Corporation sanitation crew.'
          }
        ];
      }
      setComplaints(list);
    } catch {
      if (isDemo) {
        setComplaints([
          {
            id: 'comp-demo-01',
            created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
            subject: 'Unauthorized Pavement Cart Encroachment at Spot M10-04',
            description: 'Unregistered seasonal cart has occupied pedestrian verge adjacent to my permitted tea stall, causing congestion.',
            status: 'in_review',
            profiles: { full_name: 'Rahim Uddin' },
            admin_response: 'DNCC Ward Inspector notified. Site inspection scheduled for tomorrow morning.'
          }
        ]);
      } else {
        addToast('Failed to load civic complaints registry', 'danger');
      }
    }
  }, [getToken, isDemo, addToast]);

  useEffect(() => { 
    loadComplaints(); 
  }, [loadComplaints]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/complaints`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ subject: '', description: '' });
      loadComplaints();
      addToast('Grievance logged into municipal dispute registry', 'success');
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
      addToast('Municipal ruling and response dispatched', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update complaint', 'danger');
    }
  }

  const filteredComplaints = useMemo(() => {
    if (filterTab === 'open') return complaints.filter(c => c.status === 'open' || c.status === 'in_review');
    if (filterTab === 'resolved') return complaints.filter(c => c.status === 'resolved' || c.status === 'closed');
    return complaints;
  }, [complaints, filterTab]);

  return (
    <div className="animate-entrance" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '48px' }}>
      {/* Header */}
      <div className="sv-page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="apple-pill-badge" style={{ background: 'var(--sv-primary-light)', color: 'var(--sv-primary)', border: '1px solid var(--sv-primary-border)' }}>
              ⚖️ Civic Ombudsman Desk
            </span>
            <span className="apple-pill-badge" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
              Official Grievance Registry
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>
            {isAdmin ? 'Municipal Grievance & Dispute Desk' : 'Merchant Dispute Registry'}
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--sv-text-muted)', margin: '4px 0 0' }}>
            {isAdmin 
              ? 'Review merchant spatial conflicts, encroachment reports, and issue authoritative municipal rulings.'
              : 'File formal complaints directly to Dhaka City Corporation regarding harassment, spot encroachment, or utilities.'}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="apple-card px-3 py-2 text-center" style={{ minWidth: 120 }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--sv-text-subtle)', textTransform: 'uppercase' }}>Active Cases</div>
            <div className="sv-mono-data" style={{ fontSize: '18px', fontWeight: 700, color: '#DC2626' }}>
              {complaints.filter(c => c.status === 'open' || c.status === 'in_review').length}
            </div>
          </div>
        </div>
      </div>
      
      {/* Vendor Submission Form */}
      {!isAdmin && (
        <div className="apple-card p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '18px' }}>🚨</span>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
                File Formal Civic Grievance
              </h4>
            </div>
            <span className="sv-badge sv-badge-outline" style={{ fontSize: '10.5px' }}>
              OMBUDSMAN PROTOCOL
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12">
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  Dispute Nature / Subject *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Unauthorized cart encroachment at Spot M10-04, Extortion attempt, Waterlogging..." 
                  className="form-control" 
                  value={formData.subject} 
                  onChange={e => setFormData({ ...formData, subject: e.target.value })} 
                  required 
                />
              </div>

              <div className="col-12">
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '5px' }}>
                  Detailed Circumstantial Report *
                </label>
                <textarea 
                  rows="3" 
                  placeholder="Provide precise location, involved parties, date and time, and requested civic action..." 
                  className="form-control" 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  required
                />
              </div>

              <div className="col-12 d-flex justify-content-between align-items-center mt-2">
                <span style={{ fontSize: '12px', color: 'var(--sv-text-subtle)' }}>
                  🔒 All reports are logged with your verified NID identity and audited by municipal officers.
                </span>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{ padding: '8px 24px' }}
                >
                  {loading ? 'Submitting...' : 'Lodge Formal Complaint'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Ticket List & Segmented Bar */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--sv-text-primary)' }}>
          {isAdmin ? `All Municipal Tickets (${filteredComplaints.length})` : `My Dossier History (${filteredComplaints.length})`}
        </h4>

        <div className="apple-segmented-bar">
          <button 
            className={`apple-segmented-item ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All Tickets
          </button>
          <button 
            className={`apple-segmented-item ${filterTab === 'open' ? 'active' : ''}`}
            onClick={() => setFilterTab('open')}
          >
            Active Inquiries
          </button>
          <button 
            className={`apple-segmented-item ${filterTab === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilterTab('resolved')}
          >
            Resolved Cases
          </button>
        </div>
      </div>

      <div className="d-flex flex-column gap-3">
        {filteredComplaints.length === 0 ? (
          <div className="apple-card text-center py-5 text-muted" style={{ color: 'var(--sv-text-subtle)' }}>
            No grievance records in this filter view.
          </div>
        ) : filteredComplaints.map(c => (
          <div key={c.id} className="apple-card p-4 position-relative" style={{ overflow: 'hidden' }}>
            {/* Status indicator rail */}
            <div style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '4px',
              backgroundColor: c.status === 'resolved' ? '#059669' : c.status === 'open' ? '#DC2626' : '#D97706'
            }} />

            <div className="d-flex justify-content-between align-items-start mb-3 pb-2 border-bottom flex-wrap gap-2">
              <div>
                <h5 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', color: 'var(--sv-text-primary)' }}>
                  {c.subject}
                </h5>
                <div style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
                  {isAdmin ? (
                    <>Complainant: <strong style={{ color: 'var(--sv-primary)' }}>{c.profiles?.full_name || 'Verified Merchant'}</strong> · Filed on {new Date(c.created_at).toLocaleDateString('en-GB')}</>
                  ) : (
                    <>Lodged on {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</>
                  )}
                </div>
              </div>

              <span className={`apple-pill-badge ${
                c.status === 'resolved' ? 'bg-success bg-opacity-10 text-success' :
                c.status === 'in_review' ? 'bg-warning bg-opacity-10 text-warning' :
                'bg-danger bg-opacity-10 text-danger'
              }`}>
                ● {c.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--sv-radius)',
              background: 'var(--sv-surface-subtle)',
              fontSize: '13.5px',
              color: 'var(--sv-text-body)',
              lineHeight: 1.6,
              marginBottom: '12px'
            }}>
              {c.description}
            </div>

            {c.admin_response && (
              <div style={{
                display: 'flex',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--sv-radius)',
                background: 'rgba(5, 150, 105, 0.08)',
                border: '1px solid rgba(5, 150, 105, 0.25)',
                marginTop: '12px'
              }}>
                <div style={{ fontSize: '20px' }}>⚖️</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                    Dhaka Municipal Administrative Ruling
                  </div>
                  <div style={{ fontSize: '13px', color: '#065f46', lineHeight: 1.5 }}>
                    {c.admin_response}
                  </div>
                </div>
              </div>
            )}

            {isAdmin && replyData.id !== c.id && c.status !== 'closed' && (
              <div className="text-end mt-3">
                <button 
                  onClick={() => setReplyData({ id: c.id, status: c.status, admin_response: c.admin_response || '' })} 
                  className="apple-pill-btn"
                  style={{ background: 'var(--sv-primary-light)', color: 'var(--sv-primary)', border: '1px solid var(--sv-primary-border)', padding: '5px 14px', fontSize: '12px' }}
                >
                  ✍️ Issue Municipal Ruling / Update
                </button>
              </div>
            )}

            {isAdmin && replyData.id === c.id && (
              <form onSubmit={handleAdminReply} className="mt-3 p-3 rounded-3" style={{ background: 'rgba(30, 74, 74, 0.04)', border: '1.5px solid var(--sv-primary-border)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sv-primary)', marginBottom: '10px' }}>
                  Update Complaint Ledger & Dispatch Ruling
                </div>
                <div className="row g-2">
                  <div className="col-md-3">
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '3px' }}>
                      Status
                    </label>
                    <select 
                      className="form-select form-select-sm" 
                      value={replyData.status} 
                      onChange={e => setReplyData({ ...replyData, status: e.target.value })}
                    >
                      <option value="open">Open</option>
                      <option value="in_review">In Municipal Review</option>
                      <option value="resolved">Resolved & Action Taken</option>
                      <option value="closed">Closed / Dismissed</option>
                    </select>
                  </div>
                  <div className="col-md-9">
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '3px' }}>
                      Official Resolution Note
                    </label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      placeholder="Enter municipal directives, inspection findings, or fine citation..." 
                      value={replyData.admin_response} 
                      onChange={e => setReplyData({ ...replyData, admin_response: e.target.value })} 
                      required
                    />
                  </div>
                  <div className="col-12 d-flex justify-content-end gap-2 mt-2">
                    <button 
                      type="button" 
                      onClick={() => setReplyData({ id: null, status: '', admin_response: '' })} 
                      className="apple-pill-btn"
                      style={{ background: 'var(--sv-surface-subtle)', border: '1px solid var(--sv-border)', padding: '4px 12px', fontSize: '12px' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="apple-pill-btn"
                      style={{ background: 'var(--sv-primary)', color: '#FFFFFF', padding: '4px 16px', fontSize: '12px' }}
                    >
                      Record Ruling
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
