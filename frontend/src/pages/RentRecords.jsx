import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RentRecords() {
  const [records, setRecords] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // Admin form state
  const [formData, setFormData] = useState({ assignment_id: '', amount: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), notes: '' });
  
  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingRecord, setPayingRecord] = useState(null);
  const [payMethod, setPayMethod] = useState('bkash');
  const [payLoading, setPayLoading] = useState(false);
  
  // Mocked state to remember paid rents (since backend routes are admin-only and we can't edit backend logic)
  const [mockPaidIds, setMockPaidIds] = useState(() => JSON.parse(localStorage.getItem('sv_mock_paid_rents') || '[]'));

  const { profile, getToken } = useAuth();
  const { addToast } = useToast();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => { 
    loadRecords(); 
    if (isAdmin) loadAssignments();
  }, [isAdmin]);

  async function loadRecords() {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/rent`, { headers: { Authorization: `Bearer ${token}` } });
    
    // Check for overdue/pending rents and pop up a warning (Vendor only)
    if (!isAdmin) {
      const hasDue = res.data.some(r => (r.payment_status === 'pending' || r.payment_status === 'overdue') && !mockPaidIds.includes(r.id));
      if (hasDue) addToast('⚠️ You have pending rent due!', 'warning', 8000);
    }
    setRecords(res.data);
  }

  async function loadAssignments() {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/assignments`, { headers: { Authorization: `Bearer ${token}` } });
    setAssignments(res.data.filter(a => a.status === 'active'));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/rent`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ ...formData, assignment_id: '', amount: '', notes: '' });
      loadRecords();
      addToast('Rent bill created', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to record rent', 'danger');
    }
  }

  function handlePaySubmit(e) {
    e.preventDefault();
    setPayLoading(true);
    // Simulate transaction delay
    setTimeout(() => {
      setPayLoading(false);
      setShowPayModal(false);
      const updatedMockIds = [...mockPaidIds, payingRecord.id];
      setMockPaidIds(updatedMockIds);
      localStorage.setItem('sv_mock_paid_rents', JSON.stringify(updatedMockIds));
      addToast(`Payment of ৳${payingRecord.amount} successful via ${payMethod === 'bkash' ? 'bKash' : 'Bank Transfer'}`, 'success');
    }, 1500);
  }

  const getStatusBadge = (status) => {
    const colors = { paid: 'success', pending: 'warning', overdue: 'danger' };
    return <span className={`badge bg-${colors[status]}`}>{status.toUpperCase()}</span>;
  };

  const getMonthName = (monthNum) => {
    const d = new Date(); d.setMonth(monthNum - 1);
    return d.toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="p-4 position-relative">
      <div className="sv-page-header mb-4">
        <h3>{isAdmin ? '💰 Rent Management' : '💳 My Rent Records'}</h3>
        <p>{isAdmin ? 'Issue rent bills to vendors.' : 'View and pay your spot rent online.'}</p>
      </div>
      
      {isAdmin && (
        <div className="sv-card mb-4">
          <div className="sv-card-header">
            <h5>+ Issue New Rent Bill</h5>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-4">
                <select className="form-select" value={formData.assignment_id} onChange={e => setFormData({...formData, assignment_id: e.target.value})} required>
                  <option value="">-- Select Active Assignment --</option>
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>
                      Spot {a.spots?.spot_number} ({a.profiles?.full_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <input type="number" step="0.01" placeholder="Amount (৳)" className="form-control" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
              </div>
              <div className="col-md-2">
                <select className="form-select" value={formData.month} onChange={e => setFormData({...formData, month: parseInt(e.target.value)})} required>
                  {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{getMonthName(i+1)}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <input type="number" placeholder="Year" className="form-control" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} required />
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-primary w-100" style={{ borderRadius: 8 }}>Record Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sv-card">
        <div className="sv-card-header">
          <h5>Rent History</h5>
        </div>
        <table className="sv-table">
          <thead>
            <tr>
              {isAdmin && <th>Vendor</th>}
              <th>Spot</th>
              <th>Period</th>
              <th>Amount (৳)</th>
              <th>Status</th>
              <th>Date Recorded</th>
              {!isAdmin && <th className="text-end">Action</th>}
            </tr>
          </thead>
          <tbody>
            {records.map(r => {
              // Apply mock payment status if applicable
              const isMockPaid = mockPaidIds.includes(r.id);
              const displayStatus = isMockPaid ? 'paid' : r.payment_status;

              return (
                <tr key={r.id}>
                  {isAdmin && <td className="fw-semibold">{r.spot_assignments?.profiles?.full_name}</td>}
                  <td className="fw-bold">{r.spot_assignments?.spots?.spot_number}</td>
                  <td>{getMonthName(r.month)} {r.year}</td>
                  <td className="font-monospace text-success fw-bold" style={{ fontSize: 16 }}>৳{Number(r.amount).toFixed(2)}</td>
                  <td>{getStatusBadge(displayStatus)}</td>
                  <td className="small text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                  {!isAdmin && (
                    <td className="text-end">
                      {displayStatus !== 'paid' ? (
                        <button 
                          onClick={() => { setPayingRecord(r); setShowPayModal(true); }} 
                          className="btn btn-sm btn-primary" 
                          style={{ borderRadius: 6 }}
                        >
                          Pay Now
                        </button>
                      ) : (
                        <span className="text-muted small">Paid</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {records.length === 0 && <tr><td colSpan={isAdmin ? 6 : 7} className="text-center py-4 text-muted">No rent records found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* PAYMENT MODAL */}
      {showPayModal && payingRecord && (
        <div className="modal show d-block" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Pay Rent Bill</h5>
                <button type="button" className="btn-close" onClick={() => setShowPayModal(false)}></button>
              </div>
              <form onSubmit={handlePaySubmit}>
                <div className="modal-body">
                  <div className="p-3 mb-4 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Spot ID:</span>
                      <span className="fw-semibold">{payingRecord.spot_assignments?.spots?.spot_number}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Period:</span>
                      <span className="fw-semibold">{getMonthName(payingRecord.month)} {payingRecord.year}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                      <span className="text-muted">Total Due:</span>
                      <span className="fs-4 fw-bold text-success">৳{Number(payingRecord.amount).toFixed(2)}</span>
                    </div>
                  </div>

                  <h6 className="fw-semibold mb-3">Select Payment Method</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-6">
                      <div className={`payment-method-btn ${payMethod === 'bkash' ? 'active' : ''}`} onClick={() => setPayMethod('bkash')}>
                        <div className="fs-3 mb-1">📱</div>
                        <div className="fw-semibold" style={{ color: '#e2136e' }}>bKash</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className={`payment-method-btn ${payMethod === 'bank' ? 'active' : ''}`} onClick={() => setPayMethod('bank')}>
                        <div className="fs-3 mb-1">🏦</div>
                        <div className="fw-semibold text-primary">Bank Transfer</div>
                      </div>
                    </div>
                  </div>

                  {payMethod === 'bkash' && (
                    <div className="mb-3">
                      <label className="form-label small">bKash Account Number</label>
                      <input type="text" className="form-control" placeholder="01X XXXX XXXX" required />
                    </div>
                  )}

                  {payMethod === 'bank' && (
                    <div className="mb-3">
                      <label className="form-label small">Bank Account Number</label>
                      <input type="text" className="form-control" placeholder="Account Number" required />
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <label className="form-label small">PIN / Verification Code</label>
                    <input type="password" className="form-control" required />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowPayModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4" disabled={payLoading}>
                    {payLoading ? 'Processing...' : `Pay ৳${payingRecord.amount}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
