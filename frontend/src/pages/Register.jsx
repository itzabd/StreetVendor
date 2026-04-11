import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import supabase from '../supabaseClient';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', nid_number: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, form);
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      if (loginErr) { navigate('/login'); return; }
      navigate('/vendor');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d3d22 0%, #1a6b3c 60%, #2d8f55 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a6b3c, #2d8f55)', padding: '28px 36px 20px' }}>
          <div className="d-flex align-items-center gap-3">
            <div style={{ fontSize: 32 }}>🛒</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>StreetVendor BD</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Vendor Registration</div>
            </div>
          </div>
          <h4 style={{ color: '#fff', fontWeight: 800, fontSize: 20, marginTop: 16, marginBottom: 4 }}>Create Your Vendor Account</h4>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: 0 }}>Register to apply for zones and manage your street vending spot.</p>
        </div>

        <div style={{ padding: '28px 36px 36px' }}>
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
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Phone Number</label>
                <input className="form-control" style={{ borderRadius: 10, padding: '10px 14px' }} placeholder="01XXXXXXXXX" value={form.phone} onChange={e => update('phone', e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>NID Number *</label>
                <input className="form-control" style={{ borderRadius: 10, padding: '10px 14px' }} placeholder="National ID" value={form.nid_number} onChange={e => update('nid_number', e.target.value)} required />
              </div>
              <div className="col-12 mt-2">
                <button type="submit" className="btn w-100 fw-semibold" style={{ background: '#1a6b3c', color: '#fff', borderRadius: 10, padding: '12px', fontSize: 14 }} disabled={loading}>
                  {loading ? 'Creating account...' : 'Register as Vendor'}
                </button>
              </div>
            </div>
          </form>
          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
            Already have an account? <Link to="/login" style={{ color: '#1a6b3c', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
