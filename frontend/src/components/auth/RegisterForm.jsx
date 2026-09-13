import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import supabase from '../../supabaseClient';

export default function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', nid_number: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, form);
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (loginErr) {
          if (onSwitchToLogin) onSwitchToLogin();
          return;
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  }

  const handleDemoVendor = () => {
    enterDemoMode('vendor');
    if (onSuccess) onSuccess();
    navigate('/vendor');
  };

  const handleDemoAdmin = () => {
    enterDemoMode('admin');
    if (onSuccess) onSuccess();
    navigate('/admin');
  };

  return (
    <div className="auth-form-container">
      <h3 style={{ fontWeight: 800, fontSize: 22, color: '#1a2c1e', marginBottom: 4 }}>Create Vendor Account</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 18 }}>Join our digital street vendor platform or try instant demo</p>

      {/* Instant Demo Quick Access */}
      <div className="p-3 mb-4 rounded-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="fw-bold text-success" style={{ fontSize: 12 }}>🚀 Instant Demo (No Registration)</span>
          <span className="badge bg-success text-white" style={{ fontSize: 9 }}>PUBLIC DEMO</span>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            onClick={handleDemoVendor}
            className="btn btn-sm btn-success fw-bold flex-grow-1 py-2"
            style={{ borderRadius: 8, fontSize: 12 }}
          >
            🛒 Demo Vendor
          </button>
          <button
            type="button"
            onClick={handleDemoAdmin}
            className="btn btn-sm btn-outline-dark fw-bold flex-grow-1 py-2"
            style={{ borderRadius: 8, fontSize: 12 }}
          >
            🔑 Demo Admin
          </button>
        </div>
      </div>

      <div className="d-flex align-items-center my-3">
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}></div>
        <span className="px-3 text-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR REGISTER</span>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}></div>
      </div>

      {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: 13 }}>{error}</div>}

      <form onSubmit={handleRegister}>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Full Name *</label>
            <input className="form-control" style={{ borderRadius: 10, padding: '10px 14px' }} placeholder="e.g. Mohammad Karim" value={form.full_name} onChange={e => update('full_name', e.target.value)} required />
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Email Address *</label>
            <input type="email" className="form-control" style={{ borderRadius: 10, padding: '10px 14px' }} placeholder="karim@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Password *</label>
            <input type="password" className="form-control" style={{ borderRadius: 10, padding: '10px 14px' }} placeholder="At least 6 characters" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Phone</label>
            <input className="form-control" style={{ borderRadius: 10, padding: '10px 14px' }} placeholder="01XXXXXXXXX" value={form.phone} onChange={e => update('phone', e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>NID</label>
            <input className="form-control" style={{ borderRadius: 10, padding: '10px 14px' }} placeholder="Optional" value={form.nid_number} onChange={e => update('nid_number', e.target.value)} />
          </div>
          <div className="col-12 mt-2">
            <button type="submit" className="btn w-100 fw-semibold" style={{ background: '#1a6b3c', color: '#fff', borderRadius: 10, padding: '12px', fontSize: 14 }} disabled={loading}>
              {loading ? 'Processing...' : 'Register as Vendor'}
            </button>
          </div>
        </div>
      </form>
      <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#64748b', marginBottom: 0 }}>
        Already a vendor? <button type="button" onClick={onSwitchToLogin} className="btn btn-link p-0 fw-bold" style={{ color: '#1a6b3c', fontSize: 13, textDecoration: 'none' }}>Sign In</button>
      </p>
    </div>
  );
}

