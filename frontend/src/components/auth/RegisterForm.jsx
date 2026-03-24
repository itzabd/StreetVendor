import { useState } from 'react';
import axios from 'axios';
import supabase from '../../supabaseClient';

export default function RegisterForm({ onSuccess, onSwitchToLogin }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', nid_number: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="auth-form-container">
      <h3 style={{ fontWeight: 800, fontSize: 22, color: '#1a2c1e', marginBottom: 4 }}>Create Vendor Account</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>Join our digital street vendor platform</p>

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
