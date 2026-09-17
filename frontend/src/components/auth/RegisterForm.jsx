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
      <h3 style={{ fontWeight: 700, fontSize: '20px', color: 'var(--sv-text-primary)', marginBottom: '4px' }}>
        Register Merchant Identity
      </h3>
      <p style={{ color: 'var(--sv-text-muted)', fontSize: '13px', marginBottom: '16px' }}>
        Register with Dhaka City Corporation spatial trade ledger
      </p>

      {/* Instant Demo Quick Access */}
      <div style={{
        padding: '14px',
        backgroundColor: 'var(--sv-surface-subtle)',
        border: '1px solid var(--sv-border)',
        borderRadius: 'var(--sv-radius)',
        marginBottom: '18px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', textTransform: 'uppercase' }}>
            ⚡ Instant Showcase Access (No Signup)
          </span>
          <span className="sv-badge sv-badge-success" style={{ fontSize: '9.5px' }}>
            READY
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={handleDemoVendor}
            className="btn btn-sm btn-primary"
            style={{ padding: '7px' }}
          >
            Demo Merchant
          </button>
          <button
            type="button"
            onClick={handleDemoAdmin}
            className="btn btn-sm btn-outline-dark"
            style={{ padding: '7px' }}
          >
            Demo Officer
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
        <div style={{ flex: 1, height: 1, backgroundColor: 'var(--sv-border)' }}></div>
        <span style={{ padding: '0 12px', fontSize: '11px', fontWeight: 600, color: 'var(--sv-text-subtle)', textTransform: 'uppercase' }}>
          OR NEW REGISTRATION
        </span>
        <div style={{ flex: 1, height: 1, backgroundColor: 'var(--sv-border)' }}></div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '12.5px', borderRadius: 'var(--sv-radius)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleRegister}>
        <div className="row g-2">
          <div className="col-12">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
              Full Name *
            </label>
            <input 
              className="form-control" 
              placeholder="e.g. Mohammad Karim" 
              value={form.full_name} 
              onChange={e => update('full_name', e.target.value)} 
              required 
            />
          </div>
          <div className="col-12">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
              Email Address *
            </label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="karim@dhakacity.gov.bd" 
              value={form.email} 
              onChange={e => update('email', e.target.value)} 
              required 
            />
          </div>
          <div className="col-12">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
              Account Password *
            </label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="At least 6 characters" 
              value={form.password} 
              onChange={e => update('password', e.target.value)} 
              required 
              minLength={6} 
            />
          </div>
          <div className="col-6">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
              Phone Number
            </label>
            <input 
              className="form-control" 
              placeholder="01XXXXXXXXX" 
              value={form.phone} 
              onChange={e => update('phone', e.target.value)} 
            />
          </div>
          <div className="col-6">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
              National ID (NID)
            </label>
            <input 
              className="form-control" 
              placeholder="10 or 17 digit NID" 
              value={form.nid_number} 
              onChange={e => update('nid_number', e.target.value)} 
            />
          </div>
          <div className="col-12 mt-3">
            <button 
              type="submit" 
              className="btn btn-primary w-100" 
              disabled={loading}
              style={{ padding: '9px' }}
            >
              {loading ? 'Registering Merchant...' : 'Create Merchant Account'}
            </button>
          </div>
        </div>
      </form>
      
      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12.5px', color: 'var(--sv-text-muted)', marginBottom: 0 }}>
        Already registered? <button type="button" onClick={onSwitchToLogin} className="btn btn-link p-0 fw-bold" style={{ color: 'var(--sv-primary)', fontSize: '12.5px', textDecoration: 'none' }}>Sign In</button>
      </p>
    </div>
  );
}


