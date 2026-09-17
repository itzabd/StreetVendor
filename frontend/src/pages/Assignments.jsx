import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

// ── Helpers ────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

// ── Step config ────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Select Merchant', icon: '👤' },
  { id: 2, label: 'Select Position', icon: '📍' },
  { id: 3, label: 'Lease Terms',     icon: '📋' },
];

export default function Assignments() {
  const { addToast } = useToast();
  const { confirmAction } = useConfirm();

  const [assignments, setAssignments] = useState([]);
  const [zones, setZones] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [spots, setSpots] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);

  // Wizard state
  const [step, setStep] = useState(1);
  const [selVendor, setSelVendor] = useState(null);       // full user obj
  const [selZoneId, setSelZoneId] = useState('');
  const [selBlockId, setSelBlockId] = useState('');
  const [selSpot, setSelSpot] = useState(null);           // full spot obj
  const [terms, setTerms] = useState({ start_date: new Date().toISOString().split('T')[0], end_date: '', rent_amount: '3500' });
  const [submitting, setSubmitting] = useState(false);

  const { profile, getToken, isDemo } = useAuth();
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    loadAssignments();
    if (isAdmin) { loadZones(); loadApprovedUsers(); }
  }, [isAdmin, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { 
    if (selZoneId) loadBlocks(selZoneId); 
    else { setBlocks([]); setSelBlockId(''); setSelSpot(null); } 
  }, [selZoneId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { 
    if (selBlockId) loadSpots(selBlockId); 
    else { setSpots([]); setSelSpot(null); } 
  }, [selBlockId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAssignments() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/assignments`, { headers: { Authorization: `Bearer ${token}` } });
      let list = res.data || [];
      if (isDemo && list.length === 0) {
        list = [
          {
            id: 'asgn-demo-01',
            vendor_id: profile?.id || 'vendor-01',
            status: 'active',
            rent_amount: 3500,
            start_date: '2026-01-01',
            end_date: '2026-12-31',
            profiles: { full_name: 'Rahim Uddin', phone: '+880 1711-234567' },
            spots: {
              id: 'spot-03',
              spot_number: 'M10-04',
              status: 'occupied',
              block_name: 'Block A (North Sector)',
              blocks: { block_name: 'Block A' },
              zones: { name: 'Mirpur Commercial Hub' }
            }
          }
        ];
      }
      setAssignments(list);
    } catch {
      if (isDemo) {
        setAssignments([
          {
            id: 'asgn-demo-01',
            vendor_id: profile?.id || 'vendor-01',
            status: 'active',
            rent_amount: 3500,
            start_date: '2026-01-01',
            end_date: '2026-12-31',
            profiles: { full_name: 'Rahim Uddin', phone: '+880 1711-234567' },
            spots: {
              id: 'spot-03',
              spot_number: 'M10-04',
              status: 'occupied',
              blocks: { block_name: 'Block A' },
              zones: { name: 'Mirpur Commercial Hub' }
            }
          }
        ]);
      }
    }
  }

  async function loadZones() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/zones`, { headers: { Authorization: `Bearer ${token}` } });
      setZones(res.data && res.data.length > 0 ? res.data : [
        { id: 'zone-01', name: 'Mirpur Commercial Hub' },
        { id: 'zone-02', name: 'Karwan Bazar Trade Corridor' }
      ]);
    } catch {
      setZones([
        { id: 'zone-01', name: 'Mirpur Commercial Hub' },
        { id: 'zone-02', name: 'Karwan Bazar Trade Corridor' }
      ]);
    }
  }

  async function loadBlocks(zoneId) {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/blocks?zone_id=${zoneId}`, { headers: { Authorization: `Bearer ${token}` } });
      setBlocks(res.data && res.data.length > 0 ? res.data : [
        { id: 'block-01', block_name: 'Sector A (North Roundabout)' },
        { id: 'block-02', block_name: 'Sector B (Promenade)' }
      ]);
    } catch {
      setBlocks([
        { id: 'block-01', block_name: 'Sector A (North Roundabout)' },
        { id: 'block-02', block_name: 'Sector B (Promenade)' }
      ]);
    }
  }

  async function loadSpots(blockId) {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/spots?block_id=${blockId}`, { headers: { Authorization: `Bearer ${token}` } });
      const av = (res.data || []).filter(s => s.status === 'available');
      setSpots(av.length > 0 ? av : [
        { id: 'spot-01', spot_number: 'M10-01', status: 'available' },
        { id: 'spot-02', spot_number: 'M10-02', status: 'available' }
      ]);
    } catch {
      setSpots([
        { id: 'spot-01', spot_number: 'M10-01', status: 'available' },
        { id: 'spot-02', spot_number: 'M10-02', status: 'available' }
      ]);
    }
  }

  async function loadApprovedUsers() {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/applications`, { headers: { Authorization: `Bearer ${token}` } });
      const approved = (res.data || []).filter(a => a.status === 'approved');
      const mapped = approved.map(a => ({ id: a.vendor_id, name: a.profiles?.full_name, phone: a.profiles?.phone, zone_id: a.zone_id, zone_name: a.zones?.name }));
      const users = Array.from(new Map(mapped.map(i => [i.id, i])).values());
      setApprovedUsers(users.length > 0 ? users : [
        { id: 'vendor-01', name: 'Rahim Uddin', phone: '+880 1711-234567', zone_name: 'Mirpur Commercial Hub' },
        { id: 'vendor-02', name: 'Abdul Malek', phone: '+880 1819-876543', zone_name: 'Karwan Bazar Trade Corridor' }
      ]);
    } catch {
      setApprovedUsers([
        { id: 'vendor-01', name: 'Rahim Uddin', phone: '+880 1711-234567', zone_name: 'Mirpur Commercial Hub' },
        { id: 'vendor-02', name: 'Abdul Malek', phone: '+880 1819-876543', zone_name: 'Karwan Bazar Trade Corridor' }
      ]);
    }
  }

  function handleVendorSelect(user) {
    setSelVendor(user);
    if (user?.zone_id) {
      setSelZoneId(user.zone_id);
    }
    setStep(2);
  }

  function resetWizard() {
    setStep(1); setSelVendor(null); setSelZoneId(''); setSelBlockId(''); setSelSpot(null);
    setTerms({ start_date: new Date().toISOString().split('T')[0], end_date: '', rent_amount: '3500' });
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

      const allNotifs = JSON.parse(localStorage.getItem('sv_notifications') || '[]');
      allNotifs.unshift({ 
        id: Date.now().toString(), 
        target_vendor_id: selVendor.id, 
        title: 'Spot Assigned 🎉', 
        message: `Spot #${selSpot.spot_number} has been assigned to you.`, 
        readBy: [], 
        created_at: new Date().toISOString() 
      });
      localStorage.setItem('sv_notifications', JSON.stringify(allNotifs));

      addToast('Spot assigned successfully!', 'success');
      resetWizard();
      loadAssignments();
    } catch (err) {
      if (isDemo) {
        const newAsgn = {
          id: `asgn-demo-${Date.now()}`,
          vendor_id: selVendor.id,
          status: 'active',
          rent_amount: terms.rent_amount,
          start_date: terms.start_date,
          end_date: terms.end_date || '2026-12-31',
          profiles: { full_name: selVendor.name, phone: selVendor.phone },
          spots: {
            spot_number: selSpot.spot_number,
            blocks: { block_name: blocks.find(b => b.id === selBlockId)?.block_name || 'Block A' },
            zones: { name: zones.find(z => z.id === selZoneId)?.name || 'Mirpur Commercial Hub' }
          }
        };
        setAssignments(prev => [newAsgn, ...prev]);
        addToast('Spot assigned in demo mode!', 'success');
        resetWizard();
      } else {
        addToast(err.response?.data?.error || 'Failed to assign spot', 'danger');
      }
    } finally { 
      setSubmitting(false); 
    }
  }

  async function handleRevoke(id) {
    confirmAction({
      title: 'Revoke Spatial Allocation',
      message: 'Are you sure you want to revoke this spot assignment and restore spot availability?',
      confirmText: 'Yes, Revoke Allocation',
      onConfirm: async () => {
        try {
          const token = await getToken();
          await axios.put(`${import.meta.env.VITE_API_URL}/assignments/${id}`, { status: 'revoked', end_date: new Date().toISOString().split('T')[0] }, { headers: { Authorization: `Bearer ${token}` } });
          loadAssignments();
          addToast('Assignment revoked', 'success');
        } catch {
          if (isDemo) {
            setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'revoked' } : a));
            addToast('Assignment revoked (Demo Mode)', 'success');
          }
        }
      }
    });
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Municipal Header Banner */}
      <div className="sv-card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--sv-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="sv-badge sv-badge-success">
                {isAdmin ? 'SPATIAL ALLOCATION DESK' : 'MERCHANT ALLOCATION RECORD'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--sv-text-muted)' }}>
                Dhaka Metropolitan City Corporation
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 2px' }}>
              {isAdmin ? 'Municipal Spot Assignment & Demarcation' : 'Designated Trade Position & Lease Record'}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--sv-text-secondary)' }}>
              {isAdmin 
                ? 'Assign demarcated municipal trade positions to audited and approved street vendors.' 
                : 'Review your designated trading positions, lease fee rates, and spatial validity.'}
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN: WIZARD ALLOCATION DOCKET */}
      {isAdmin && (
        <div className="sv-card">
          <div className="sv-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h5>Direct Spot Allocation Wizard</h5>
              <span className="sv-badge sv-badge-info">STEP {step} OF 3</span>
            </div>
            <button 
              onClick={resetWizard} 
              className="btn btn-outline-dark btn-sm"
              style={{ fontSize: '11.5px', padding: '3px 8px' }}
            >
              ↺ Reset
            </button>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {/* Step Navigation Bar */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
              {STEPS.map((s, i) => {
                const isActive = step === s.id;
                const isPassed = step > s.id;
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div 
                      onClick={() => isPassed && setStep(s.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        cursor: isPassed ? 'pointer' : 'default',
                        opacity: isActive || isPassed ? 1 : 0.6
                      }}
                    >
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--sv-radius-sm)',
                        backgroundColor: isActive || isPassed ? 'var(--sv-primary)' : 'var(--sv-surface-subtle)',
                        color: isActive || isPassed ? '#FFFFFF' : 'var(--sv-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        fontFamily: 'var(--sv-font-mono)'
                      }}>
                        {isPassed ? '✓' : s.id}
                      </div>
                      <span style={{ fontSize: '12.5px', fontWeight: isActive ? 700 : 500, color: 'var(--sv-text-primary)' }}>
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--sv-border)', margin: '0 12px' }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* STEP 1: Select Vendor */}
            {step === 1 && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--sv-text-muted)', marginBottom: '14px' }}>
                  Select an approved merchant from the audit queue to assign a demarcated trade position:
                </div>
                {approvedUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--sv-text-muted)', backgroundColor: 'var(--sv-surface-subtle)', borderRadius: 'var(--sv-radius)' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
                    <div>No approved merchants awaiting spot assignment.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {approvedUsers.map(u => (
                      <div 
                        key={u.id}
                        onClick={() => handleVendorSelect(u)}
                        style={{
                          padding: '14px',
                          border: `1px solid ${selVendor?.id === u.id ? 'var(--sv-primary)' : 'var(--sv-border)'}`,
                          borderRadius: 'var(--sv-radius)',
                          backgroundColor: selVendor?.id === u.id ? 'var(--sv-surface-subtle)' : 'var(--sv-surface)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: 'var(--sv-radius-sm)',
                          backgroundColor: 'var(--sv-primary)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          {initials(u.name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--sv-text-primary)' }}>
                            {u.name}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--sv-text-muted)' }}>
                            📞 {u.phone || 'On file'} {u.zone_name && `· Ward: ${u.zone_name}`}
                          </div>
                        </div>
                        {selVendor?.id === u.id && (
                          <span style={{ color: 'var(--sv-primary)', fontWeight: 700 }}>✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Select Location */}
            {step === 2 && (
              <div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 16px', 
                  backgroundColor: 'var(--sv-surface-subtle)', 
                  borderRadius: 'var(--sv-radius)', 
                  marginBottom: '16px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>
                      Selected Merchant: <span style={{ color: 'var(--sv-primary)', fontWeight: 700 }}>{selVendor?.name}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelVendor(null); setStep(1); }} 
                    className="btn btn-outline-dark btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                  >
                    Change Merchant
                  </button>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                      Municipal Zone
                    </label>
                    <select 
                      className="form-select" 
                      value={selZoneId} 
                      onChange={e => { setSelZoneId(e.target.value); setSelBlockId(''); setSelSpot(null); }}
                    >
                      <option value="">— Choose Zone —</option>
                      {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                      Sector / Block
                    </label>
                    <select 
                      className="form-select" 
                      value={selBlockId} 
                      disabled={!selZoneId} 
                      onChange={e => { setSelBlockId(e.target.value); setSelSpot(null); }}
                    >
                      <option value="">— Choose Block —</option>
                      {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
                    </select>
                  </div>
                </div>

                {selBlockId && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '6px' }}>
                      Demarcated Spots in Sector
                    </label>
                    {spots.length === 0 ? (
                      <div style={{ padding: '14px', backgroundColor: 'var(--sv-surface-subtle)', borderRadius: 'var(--sv-radius)', color: 'var(--sv-text-muted)', fontSize: '12px' }}>
                        No available spots in this sector.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {spots.map(s => {
                          const isSel = selSpot?.id === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelSpot(s)}
                              className="btn btn-sm"
                              style={{
                                backgroundColor: isSel ? 'var(--sv-primary)' : 'var(--sv-surface)',
                                color: isSel ? '#FFFFFF' : 'var(--sv-text-primary)',
                                border: `1px solid ${isSel ? 'var(--sv-primary)' : 'var(--sv-border)'}`,
                                fontFamily: 'var(--sv-font-mono)',
                                fontSize: '12px',
                                padding: '6px 14px'
                              }}
                            >
                              #{s.spot_number}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <button 
                  onClick={() => setStep(3)} 
                  disabled={!selSpot} 
                  className="btn btn-primary w-100"
                  style={{ padding: '9px' }}
                >
                  Continue → Establish Lease Terms
                </button>
              </div>
            )}

            {/* STEP 3: Set Terms */}
            {step === 3 && (
              <div>
                {/* Summary card */}
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: 'var(--sv-surface-subtle)', 
                  border: '1px solid var(--sv-border)', 
                  borderRadius: 'var(--sv-radius)', 
                  marginBottom: '16px' 
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--sv-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Allocation Verification Summary
                  </div>
                  <div className="row g-2">
                    <div className="col-6 col-md-3">
                      <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)' }}>Merchant</div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{selVendor?.name}</div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)' }}>Allocated Spot</div>
                      <div className="sv-mono-data" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sv-primary)' }}>
                        #{selSpot?.spot_number}
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)' }}>Sector</div>
                      <div style={{ fontSize: '13px' }}>{blocks.find(b => b.id === selBlockId)?.block_name}</div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)' }}>Zone</div>
                      <div style={{ fontSize: '13px' }}>{zones.find(z => z.id === selZoneId)?.name}</div>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                      Start Date
                    </label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={terms.start_date} 
                      onChange={e => setTerms(p => ({ ...p, start_date: e.target.value }))} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                      End Date (Optional)
                    </label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={terms.end_date} 
                      onChange={e => setTerms(p => ({ ...p, end_date: e.target.value }))} 
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
                    Monthly Municipal Lease Fee (৳)
                  </label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="3500" 
                    value={terms.rent_amount} 
                    onChange={e => setTerms(p => ({ ...p, rent_amount: e.target.value }))} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setStep(2)} 
                    className="btn btn-outline-dark"
                    style={{ padding: '9px 16px' }}
                  >
                    ← Back
                  </button>
                  <button 
                    onClick={handleSubmit} 
                    disabled={submitting || !terms.rent_amount} 
                    className="btn btn-primary flex-grow-1"
                    style={{ padding: '9px' }}
                  >
                    {submitting ? 'Allocating Spot...' : '🚀 Confirm & Allocate Spot Demarcation'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSIGNMENTS LEDGER DOCKET */}
      <div className="sv-card">
        <div className="sv-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h5>{isAdmin ? 'Active Municipal Spot Allocations' : 'My Designated Spot Allocations'}</h5>
            <span className="sv-badge sv-badge-info">
              {assignments.length} ALLOCATIONS
            </span>
          </div>
        </div>

        <div style={{ padding: '16px' }}>
          {assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--sv-text-muted)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📌</div>
              <div style={{ fontWeight: 600 }}>No spot allocations recorded.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {assignments.map(a => {
                const isActive = a.status === 'active';
                return (
                  <div 
                    key={a.id}
                    style={{ 
                      padding: '16px', 
                      backgroundColor: 'var(--sv-surface)', 
                      border: '1px solid var(--sv-border)', 
                      borderRadius: 'var(--sv-radius)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span className="sv-mono-data" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--sv-primary)' }}>
                          #{a.spots?.spot_number || 'M10-04'}
                        </span>
                        <div style={{ fontSize: '12px', color: 'var(--sv-text-muted)', marginTop: '2px' }}>
                          {a.spots?.zones?.name || a.spots?.blocks?.zones?.name || 'Mirpur Commercial Hub'}
                        </div>
                      </div>
                      <span className={`sv-badge ${isActive ? 'sv-badge-success' : 'sv-badge-danger'}`}>
                        {a.status.toUpperCase()}
                      </span>
                    </div>

                    {isAdmin && a.profiles && (
                      <div style={{ fontSize: '12.5px', color: 'var(--sv-text-secondary)', borderTop: '1px solid var(--sv-border)', paddingTop: '8px' }}>
                        Merchant: <strong>{a.profiles.full_name}</strong> · Tel: {a.profiles.phone || 'On file'}
                      </div>
                    )}

                    <div style={{ 
                      padding: '10px 12px', 
                      backgroundColor: 'var(--sv-surface-subtle)', 
                      borderRadius: 'var(--sv-radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)', textTransform: 'uppercase' }}>Monthly Lease</div>
                        <div className="sv-mono-data" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--sv-text-primary)' }}>
                          ৳{Number(a.rent_amount || 3500).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10.5px', color: 'var(--sv-text-muted)', textTransform: 'uppercase' }}>Validity</div>
                        <div className="sv-mono-data" style={{ fontSize: '11.5px', color: 'var(--sv-text-secondary)' }}>
                          {fmtDate(a.start_date)} → {a.end_date ? fmtDate(a.end_date) : 'Ongoing'}
                        </div>
                      </div>
                    </div>

                    {isAdmin && isActive && (
                      <button 
                        onClick={() => handleRevoke(a.id)}
                        className="btn btn-outline-danger btn-sm"
                        style={{ padding: '5px' }}
                      >
                        Revoke Spot Demarcation
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
