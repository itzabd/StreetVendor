import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

// ── Helpers ────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();

// ── Step config ────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Select Vendor',   icon: '👤' },
  { id: 2, label: 'Select Location', icon: '📍' },
  { id: 3, label: 'Set Terms',       icon: '📋' },
];

export default function Assignments() {
  const { addToast } = useToast();
  const { confirmAction } = useConfirm();

  const [assignments, setAssignments] = useState([]);
  const [zones, setZones] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [spots, setSpots] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [approvedApps, setApprovedApps] = useState([]);

  // Wizard state
  const [step, setStep] = useState(1);
  const [selVendor, setSelVendor] = useState(null);       // full user obj
  const [selZoneId, setSelZoneId] = useState('');
  const [selBlockId, setSelBlockId] = useState('');
  const [selSpot, setSelSpot] = useState(null);           // full spot obj
  const [terms, setTerms] = useState({ start_date: new Date().toISOString().split('T')[0], end_date:'', rent_amount:'' });
  const [submitting, setSubmitting] = useState(false);

  const { profile, getToken } = useAuth();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    loadAssignments();
    if (isAdmin) { loadZones(); loadApprovedUsers(); }
  }, [isAdmin]);

  useEffect(() => { if (selZoneId) loadBlocks(selZoneId); else { setBlocks([]); setSelBlockId(''); setSelSpot(null); } }, [selZoneId]);
  useEffect(() => { if (selBlockId) loadSpots(selBlockId); else { setSpots([]); setSelSpot(null); } }, [selBlockId]);

  async function loadAssignments() {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/assignments`, { headers: { Authorization: `Bearer ${token}` } });
    setAssignments(res.data);
  }
  async function loadZones() {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
    setZones(res.data);
  }
  async function loadBlocks(zoneId) {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/blocks?zone_id=${zoneId}`, { headers: { Authorization: `Bearer ${token}` } });
    setBlocks(res.data);
  }
  async function loadSpots(blockId) {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/spots?block_id=${blockId}`, { headers: { Authorization: `Bearer ${token}` } });
    setSpots(res.data.filter(s => s.status === 'available'));
  }
  async function loadApprovedUsers() {
    const token = await getToken();
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/applications`, { headers: { Authorization: `Bearer ${token}` } });
    const approved = res.data.filter(a => a.status === 'approved');
    const mapped = approved.map(a => ({ id: a.vendor_id, name: a.profiles?.full_name, phone: a.profiles?.phone, zone_id: a.zone_id, zone_name: a.zones?.name }));
    setApprovedUsers(Array.from(new Map(mapped.map(i => [i.id, i])).values()));
    setApprovedApps(approved);
  }

  function handleVendorSelect(user) {
    setSelVendor(user);
    // Auto-fill zone from their approved application
    if (user?.zone_id) {
      setSelZoneId(user.zone_id);
    }
    setStep(2);
  }

  function resetWizard() {
    setStep(1); setSelVendor(null); setSelZoneId(''); setSelBlockId(''); setSelSpot(null);
    setTerms({ start_date: new Date().toISOString().split('T')[0], end_date:'', rent_amount:'' });
  }

  async function handleSubmit() {
    if (!selVendor || !selSpot || !terms.rent_amount) return addToast('Please complete all required fields', 'warning');
    setSubmitting(true);
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/assignments`, {
        vendor_id: selVendor.id,
        spot_id: selSpot.id,
        start_date: terms.start_date,
        end_date: terms.end_date || null,
        rent_amount: terms.rent_amount,
      }, { headers: { Authorization: `Bearer ${token}` } });

      // Notification
      const allNotifs = JSON.parse(localStorage.getItem('sv_notifications') || '[]');
      allNotifs.unshift({ id: Date.now().toString() + Math.random().toString(36).substr(2,5), target_vendor_id: selVendor.id, title: 'Spot Assigned 🎉', message: `Spot #${selSpot.spot_number} has been assigned to you.`, readBy: [], created_at: new Date().toISOString() });
      localStorage.setItem('sv_notifications', JSON.stringify(allNotifs));

      addToast('Spot assigned successfully!', 'success');
      resetWizard();
      loadAssignments();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to assign spot', 'danger');
    } finally { setSubmitting(false); }
  }

  async function handleRevoke(id) {
    confirmAction({
      title: 'Revoke Assignment',
      message: 'Are you sure you want to revoke this assignment and free up the spot?',
      confirmText: 'Yes, Revoke',
      onConfirm: async () => {
        const token = await getToken();
        await axios.put(`${import.meta.env.VITE_API_URL}/assignments/${id}`, { status: 'revoked', end_date: new Date().toISOString().split('T')[0] }, { headers: { Authorization: `Bearer ${token}` } });
        loadAssignments();
        addToast('Assignment revoked', 'success');
      }
    });
  }

  const statusDot = { active: '#10b981', ended: '#94a3b8', revoked: '#ef4444' };
  const statusLabel = { active: 'Active', ended: 'Ended', revoked: 'Revoked' };

  return (
    <div className="animate-entrance">
      <div className="sv-page-header">
        <h3>{isAdmin ? '📌 Spot Assignments' : '📌 My Assigned Spots'}</h3>
        <p>{isAdmin ? 'Assign available spots to approved vendors' : 'View your currently assigned vending spots'}</p>
      </div>

      {/* ══ ADMIN: WIZARD PANEL ═══════════════════════════════ */}
      {isAdmin && (
        <div className="sv-card mb-4 animate-entrance delay-1">
          {/* Step indicator */}
          <div className="sv-card-header" style={{ paddingBottom: 0, borderBottom: 'none' }}>
            <h5 style={{ fontSize: 14 }}>New Assignment</h5>
            <button onClick={resetWizard} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>↺ Reset</button>
          </div>
          <div style={{ padding: '16px 24px 0' }}>
            <div className="d-flex align-items-center gap-0" style={{ marginBottom: 24 }}>
              {STEPS.map((s, i) => (
                <div key={s.id} className="d-flex align-items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                  <div className="d-flex flex-column align-items-center" style={{ cursor: step > s.id ? 'pointer' : 'default' }} onClick={() => step > s.id && setStep(s.id)}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${step >= s.id ? '#1a6b3c' : '#e2e8f0'}`, background: step > s.id ? '#1a6b3c' : step === s.id ? '#f0fdf4' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: step > s.id ? 14 : 16, transition: 'all 0.3s', boxShadow: step === s.id ? '0 0 0 4px rgba(26,107,60,0.12)' : 'none', color: step > s.id ? '#fff' : step === s.id ? '#1a6b3c' : '#cbd5e1' }}>
                      {step > s.id ? '✓' : s.icon}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, marginTop: 4, color: step >= s.id ? '#1a6b3c' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{s.label}</div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: step > s.id ? '#1a6b3c' : '#e2e8f0', margin: '0 8px', marginBottom: 22, transition: 'all 0.3s' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div style={{ padding: '0 24px 24px' }}>

            {/* ── Step 1: Select Vendor ── */}
            {step === 1 && (
              <div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Select a vendor with an approved application</div>
                {approvedUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', background: '#f8fafc', borderRadius: 12 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                    <div>No vendors with approved applications yet.</div>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {approvedUsers.map(u => (
                      <div key={u.id} onClick={() => handleVendorSelect(u)} className="sv-hover-lift d-flex align-items-center gap-3" style={{ padding: '14px 16px', borderRadius: 12, border: `2px solid ${selVendor?.id === u.id ? '#1a6b3c' : '#e2e8f0'}`, background: selVendor?.id === u.id ? '#f0fdf4' : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #1a6b3c, #2d8f55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                          {initials(u.name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>📞 {u.phone || 'No phone'}</div>
                        </div>
                        {u.zone_name && <span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{u.zone_name}</span>}
                        {selVendor?.id === u.id && <span style={{ color: '#1a6b3c', fontSize: 18 }}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Select Location ── */}
            {step === 2 && (
              <div>
                <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1a6b3c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>{initials(selVendor?.name)}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{selVendor?.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{selVendor?.phone}</div>
                  </div>
                  <button onClick={() => { setSelVendor(null); setStep(1); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}>Change</button>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Zone</label>
                    <select className="form-select" value={selZoneId} onChange={e => { setSelZoneId(e.target.value); setSelBlockId(''); setSelSpot(null); }}>
                      <option value="">— Select Zone —</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Block</label>
                    <select className="form-select" value={selBlockId} disabled={!selZoneId} onChange={e => { setSelBlockId(e.target.value); setSelSpot(null); }}>
                      <option value="">— Select Block —</option>
                      {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
                    </select>
                  </div>
                </div>

                {selBlockId && (
                  <div className="mb-4">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Available Spots {spots.length > 0 && <span style={{ color: '#94a3b8', fontWeight: 400 }}>— click to select</span>}</label>
                    {spots.length === 0 ? (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '16px', textAlign: 'center', color: '#991b1b', fontSize: 13 }}>
                        ⚠️ No available spots in this block
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                        {spots.map(s => (
                          <div key={s.id} onClick={() => setSelSpot(s)} style={{ padding: '12px 8px', borderRadius: 12, border: `2px solid ${selSpot?.id === s.id ? '#1a6b3c' : '#e2e8f0'}`, background: selSpot?.id === s.id ? '#f0fdf4' : '#fff', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', boxShadow: selSpot?.id === s.id ? '0 0 0 3px rgba(26,107,60,0.12)' : 'none' }}>
                            <div style={{ fontSize: 18, marginBottom: 4 }}>{selSpot?.id === s.id ? '📌' : '🔲'}</div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>#{s.spot_number}</div>
                            {s.latitude && <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>GPS ✔</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button onClick={() => setStep(3)} disabled={!selSpot} className="btn btn-primary w-100" style={{ borderRadius: 10, fontWeight: 700, fontSize: 14, padding: '12px', opacity: selSpot ? 1 : 0.5 }}>
                  Continue → Set Terms
                </button>
              </div>
            )}

            {/* ── Step 3: Set Terms ── */}
            {step === 3 && (
              <div>
                {/* Summary before confirmation */}
                <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac', borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Assignment Summary</div>
                  <div className="row g-2">
                    {[
                      { label: 'Vendor',    value: selVendor?.name },
                      { label: 'Spot',      value: `#${selSpot?.spot_number}` },
                      { label: 'Block',     value: blocks.find(b => b.id === selBlockId)?.block_name },
                      { label: 'Zone',      value: zones.find(z => z.id === selZoneId)?.name },
                    ].map(i => (
                      <div key={i.label} className="col-6">
                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{i.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{i.value || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Start Date</label>
                    <input type="date" className="form-control" value={terms.start_date} onChange={e => setTerms(p => ({ ...p, start_date: e.target.value }))} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>End Date <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
                    <input type="date" className="form-control" value={terms.end_date} onChange={e => setTerms(p => ({ ...p, end_date: e.target.value }))} />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 13 }}>Monthly Rent Amount</label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ background: '#f0fdf4', color: '#1a6b3c', fontWeight: 700, border: '1px solid #e2e8f0' }}>৳</span>
                    <input type="number" step="0.01" className="form-control" placeholder="0.00" value={terms.rent_amount} onChange={e => setTerms(p => ({ ...p, rent_amount: e.target.value }))} />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button onClick={() => setStep(2)} className="btn btn-outline-secondary" style={{ borderRadius: 10, fontWeight: 600 }}>← Back</button>
                  <button onClick={handleSubmit} disabled={submitting || !terms.rent_amount} className="btn btn-primary flex-grow-1" style={{ background: '#1a6b3c', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, padding: '12px' }}>
                    {submitting ? '⏳ Assigning...' : '🚀 Confirm & Assign Spot'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ ASSIGNMENT CARDS ════════════════════════════════ */}
      <div className="sv-card animate-entrance delay-2">
        <div className="sv-card-header">
          <h5>{isAdmin ? `All Assignments (${assignments.length})` : `My Assignments (${assignments.length})`}</h5>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {assignments.filter(a => a.status === 'active').length} active
          </div>
        </div>

        {assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📌</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No assignments yet</div>
            <div style={{ fontSize: 13 }}>{isAdmin ? 'Use the form above to assign a spot to a vendor.' : 'Once an admin assigns you a spot, it will appear here.'}</div>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {assignments.map(a => (
                <div key={a.id} className="sv-hover-lift" style={{ border: `1.5px solid ${a.status === 'active' ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: 16, padding: '18px', background: a.status === 'active' ? 'linear-gradient(135deg, #f0fdf4, #fff)' : '#fafafa', position: 'relative', overflow: 'hidden', transition: 'all 0.3s' }}>
                  {/* Status pulse indicator */}
                  <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot[a.status] || '#94a3b8', display: 'inline-block', boxShadow: a.status === 'active' ? '0 0 0 0 #10b98133' : 'none', animation: a.status === 'active' ? 'assignPulse 2s infinite' : 'none' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: statusDot[a.status], textTransform: 'uppercase', letterSpacing: '0.06em' }}>{statusLabel[a.status]}</span>
                  </div>

                  {/* Vendor info (admin only) */}
                  {isAdmin && (
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1a6b3c, #2d8f55)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                        {initials(a.profiles?.full_name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{a.profiles?.full_name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.profiles?.phone || 'No phone'}</div>
                      </div>
                    </div>
                  )}

                  {/* Location chip */}
                  <div style={{ background: '#1a6b3c', color: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📍</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1 }}>#{a.spots?.spot_number}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>{a.spots?.blocks?.block_name}, {a.spots?.blocks?.zones?.name}</div>
                    </div>
                  </div>

                  {/* Rent */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Monthly Rent</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', lineHeight: 1.1 }}>৳{Number(a.rent_amount || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Duration</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{fmtDate(a.start_date)}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>to {a.end_date ? fmtDate(a.end_date) : 'Ongoing'}</div>
                    </div>
                  </div>

                  {/* Admin actions */}
                  {isAdmin && a.status === 'active' && (
                    <button onClick={() => handleRevoke(a.id)} className="btn btn-outline-danger btn-sm w-100" style={{ borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                      Revoke Assignment
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes assignPulse {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
      `}</style>
    </div>
  );
}
