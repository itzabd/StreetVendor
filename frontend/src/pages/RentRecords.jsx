import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function RentRecords() {
  const [records, setRecords] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // Admin form state
  const [formData, setFormData] = useState({ 
    assignment_id: '', 
    amount: '3500', 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear(), 
    notes: '' 
  });
  
  // Payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingRecord, setPayingRecord] = useState(null);
  const [payMethod, setPayMethod] = useState('bkash');
  const [payLoading, setPayLoading] = useState(false);
  
  // Mocked state to remember paid rents
  const [mockPaidIds, setMockPaidIds] = useState(() => JSON.parse(localStorage.getItem('sv_mock_paid_rents') || '[]'));

  const { profile, getToken, isDemo } = useAuth();
  const { addToast } = useToast();
  const isAdmin = profile?.role === 'admin';

  async function loadRecords() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/rent`, { headers: { Authorization: `Bearer ${token}` } });
      let list = res.data || [];
      if (isDemo && list.length === 0) {
        list = [
          {
            id: 'rent-demo-01',
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            amount: 3500,
            payment_status: 'pending',
            created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
            spot_assignments: {
              spots: { spot_number: 'M10-04' },
              profiles: { full_name: 'Rahim Uddin' }
            }
          },
          {
            id: 'rent-demo-02',
            month: new Date().getMonth(),
            year: new Date().getFullYear(),
            amount: 3500,
            payment_status: 'paid',
            created_at: new Date(Date.now() - 86400000 * 35).toISOString(),
            spot_assignments: {
              spots: { spot_number: 'M10-04' },
              profiles: { full_name: 'Rahim Uddin' }
            }
          }
        ];
      }
      setRecords(list);
    } catch {
      if (isDemo) {
        setRecords([
          {
            id: 'rent-demo-01',
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            amount: 3500,
            payment_status: 'pending',
            created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
            spot_assignments: {
              spots: { spot_number: 'M10-04' },
              profiles: { full_name: 'Rahim Uddin' }
            }
          }
        ]);
      }
    }
  }

  async function loadAssignments() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/assignments`, { headers: { Authorization: `Bearer ${token}` } });
      const active = (res.data || []).filter(a => a.status === 'active');
      setAssignments(active.length > 0 ? active : [
        { id: 'asgn-01', spots: { spot_number: 'M10-04' }, profiles: { full_name: 'Rahim Uddin' } },
        { id: 'asgn-02', spots: { spot_number: 'KB-01' }, profiles: { full_name: 'Abdul Malek' } }
      ]);
    } catch {
      setAssignments([
        { id: 'asgn-01', spots: { spot_number: 'M10-04' }, profiles: { full_name: 'Rahim Uddin' } },
        { id: 'asgn-02', spots: { spot_number: 'KB-01' }, profiles: { full_name: 'Abdul Malek' } }
      ]);
    }
  }

  useEffect(() => { 
    loadRecords(); 
    if (isAdmin) loadAssignments();
  }, [isAdmin, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/rent`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setFormData({ ...formData, assignment_id: '', amount: '3500', notes: '' });
      loadRecords();
      addToast('Municipal rent bill recorded.', 'success');
    } catch (err) {
      if (isDemo) {
        const asgnObj = assignments.find(a => a.id === formData.assignment_id);
        const newRecord = {
          id: `rent-demo-${Date.now()}`,
          month: parseInt(formData.month),
          year: parseInt(formData.year),
          amount: parseFloat(formData.amount),
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          spot_assignments: {
            spots: { spot_number: asgnObj?.spots?.spot_number || 'M10-04' },
            profiles: { full_name: asgnObj?.profiles?.full_name || 'Rahim Uddin' }
          }
        };
        setRecords(prev => [newRecord, ...prev]);
        addToast('Municipal rent bill created (Demo Mode)', 'success');
      } else {
        addToast(err.response?.data?.error || 'Failed to record rent', 'danger');
      }
    }
  }

  function handlePaySubmit(e) {
    e.preventDefault();
    setPayLoading(true);
    setTimeout(() => {
      setPayLoading(false);
      setShowPayModal(false);
      const updatedMockIds = [...mockPaidIds, payingRecord.id];
      setMockPaidIds(updatedMockIds);
      localStorage.setItem('sv_mock_paid_rents', JSON.stringify(updatedMockIds));
      addToast(`Payment of ৳${Number(payingRecord.amount).toLocaleString()} cleared via ${payMethod === 'bkash' ? 'bKash Mobile' : 'Direct Bank'}!`, 'success');
    }, 1000);
  }

  const getMonthName = (monthNum) => {
    const d = new Date(); d.setMonth(monthNum - 1);
    return d.toLocaleString('default', { month: 'long' });
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Municipal Header Banner */}
      <div className="sv-card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--sv-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="sv-badge sv-badge-success">
                {isAdmin ? 'REVENUE & LEASE ACCOUNTING' : 'MERCHANT LEASE ACCOUNT'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
                Dhaka Metropolitan City Corporation
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 2px' }}>
              {isAdmin ? 'Municipal Spot Lease & Revenue Ledger' : 'My Spot Lease Dues & Payment Receipts'}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--sv-text-secondary)' }}>
              {isAdmin 
                ? 'Assess monthly spot lease invoices, track municipal revenue collection, and verify settlement.' 
                : 'Review monthly spot lease invoices, download receipts, and settle dues digitally.'}
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN: ISSUE RENT BILL FORM */}
      {isAdmin && (
        <div className="sv-card">
          <div className="sv-card-header">
            <h5>Assess New Monthly Spot Lease Bill</h5>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-4">
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                  Allocated Spot Assignment
                </label>
                <select className="form-select" value={formData.assignment_id} onChange={e => setFormData({...formData, assignment_id: e.target.value})} required>
                  <option value="">— Select Active Allocation —</option>
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>
                      Spot #{a.spots?.spot_number} ({a.profiles?.full_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                  Lease Fee (৳)
                </label>
                <input type="number" step="0.01" placeholder="3500" className="form-control" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
              </div>
              <div className="col-md-2">
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                  Billing Month
                </label>
                <select className="form-select" value={formData.month} onChange={e => setFormData({...formData, month: parseInt(e.target.value)})} required>
                  {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{getMonthName(i+1)}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                  Calendar Year
                </label>
                <input type="number" placeholder="Year" className="form-control" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} required />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button type="submit" className="btn btn-primary w-100" style={{ padding: '8px' }}>
                  Issue Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENT RECORDS TABLE */}
      <div className="sv-card">
        <div className="sv-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h5>Lease Settlement History</h5>
            <span className="sv-badge sv-badge-info">{records.length} INVOICES</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="sv-table">
            <thead>
              <tr>
                {isAdmin && <th>Merchant</th>}
                <th>Demarcated Spot</th>
                <th>Assessment Month</th>
                <th>Fee Amount (৳)</th>
                <th>Settlement Status</th>
                <th>Invoice Date</th>
                {!isAdmin && <th style={{ textAlign: 'right' }}>Digital Settlement</th>}
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const isMockPaid = mockPaidIds.includes(r.id);
                const displayStatus = isMockPaid ? 'paid' : r.payment_status;
                const statusBadge = displayStatus === 'paid' ? 'sv-badge-success' : displayStatus === 'pending' ? 'sv-badge-warning' : 'sv-badge-danger';

                return (
                  <tr key={r.id}>
                    {isAdmin && (
                      <td style={{ fontWeight: 600, color: 'var(--sv-text-primary)' }}>
                        {r.spot_assignments?.profiles?.full_name || 'Rahim Uddin'}
                      </td>
                    )}
                    <td className="sv-mono-data" style={{ fontWeight: 700 }}>
                      #{r.spot_assignments?.spots?.spot_number || 'M10-04'}
                    </td>
                    <td>{getMonthName(r.month)} {r.year}</td>
                    <td className="sv-mono-data" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--sv-text-primary)' }}>
                      ৳{Number(r.amount).toLocaleString()}
                    </td>
                    <td>
                      <span className={`sv-badge ${statusBadge}`}>
                        {displayStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="sv-mono-data" style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    {!isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        {displayStatus !== 'paid' ? (
                          <button 
                            onClick={() => { setPayingRecord(r); setShowPayModal(true); }} 
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 12px', fontSize: '12px' }}
                          >
                            💳 Settle Invoice
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--sv-status-success)', fontWeight: 600 }}>
                            ✓ Settled
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 6} style={{ textAlign: 'center', padding: '36px', color: 'var(--sv-text-muted)' }}>
                    No lease assessment records on file.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPayModal && payingRecord && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: 'rgba(11, 24, 18, 0.75)',
          backdropFilter: 'blur(6px)'
        }}>
          <div className="sv-card" style={{ maxWidth: '460px', width: '100%', padding: '24px', boxShadow: 'var(--sv-shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                Official Lease Fee Settlement
              </h4>
              <button 
                onClick={() => setShowPayModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '16px', color: 'var(--sv-text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaySubmit}>
              <div style={{ 
                padding: '14px', 
                backgroundColor: 'var(--sv-surface-subtle)', 
                border: '1px solid var(--sv-border)', 
                borderRadius: 'var(--sv-radius)',
                marginBottom: '16px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--sv-text-muted)' }}>Spot Position:</span>
                  <span className="sv-mono-data" style={{ fontWeight: 700 }}>#{payingRecord.spot_assignments?.spots?.spot_number || 'M10-04'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--sv-text-muted)' }}>Assessment Period:</span>
                  <span style={{ fontWeight: 600 }}>{getMonthName(payingRecord.month)} {payingRecord.year}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--sv-border)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)' }}>Total Fee Due:</span>
                  <span className="sv-mono-data" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--sv-primary)' }}>
                    ৳{Number(payingRecord.amount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '6px' }}>
                  Payment Channel
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPayMethod('bkash')}
                    className="btn btn-sm"
                    style={{
                      padding: '10px',
                      backgroundColor: payMethod === 'bkash' ? 'var(--sv-primary-light)' : 'var(--sv-surface)',
                      border: `1.5px solid ${payMethod === 'bkash' ? 'var(--sv-primary)' : 'var(--sv-border)'}`,
                      color: payMethod === 'bkash' ? 'var(--sv-primary)' : 'var(--sv-text-primary)',
                      fontWeight: 700
                    }}
                  >
                    📱 bKash Merchant
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('bank')}
                    className="btn btn-sm"
                    style={{
                      padding: '10px',
                      backgroundColor: payMethod === 'bank' ? 'var(--sv-primary-light)' : 'var(--sv-surface)',
                      border: `1.5px solid ${payMethod === 'bank' ? 'var(--sv-primary)' : 'var(--sv-border)'}`,
                      color: payMethod === 'bank' ? 'var(--sv-primary)' : 'var(--sv-text-primary)',
                      fontWeight: 700
                    }}
                  >
                    🏦 Sonali Bank
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                  {payMethod === 'bkash' ? 'bKash Wallet Number' : 'Bank Account Reference'}
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder={payMethod === 'bkash' ? '01711-234567' : 'SB-2026-004921'} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowPayModal(false)}
                  className="btn btn-outline-dark"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-grow-1" 
                  disabled={payLoading}
                  style={{ padding: '8px' }}
                >
                  {payLoading ? 'Clearing Transaction...' : `Confirm Settlement (৳${Number(payingRecord.amount).toLocaleString()})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
