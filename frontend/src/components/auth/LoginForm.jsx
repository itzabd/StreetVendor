import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../supabaseClient';

export default function LoginForm({ onSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (onSuccess) onSuccess();
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
      <h3 style={{ fontWeight: 800, fontSize: 22, color: '#1a2c1e', marginBottom: 4 }}>Welcome back</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>Sign in to your account or try instant demo</p>

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
        <span className="px-3 text-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR SIGN IN</span>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}></div>
      </div>

      {error && <div className="alert alert-danger py-2" style={{ fontSize: 13 }}>{error}</div>}

      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label className="form-label fw-semibold" style={{ fontSize: 13, color: '#374151' }}>Email address</label>
          <input type="email" className="form-control" style={{ borderRadius: 10, padding: '10px 14px', fontSize: 14 }} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </div>
        <div className="mb-4">
          <label className="form-label fw-semibold" style={{ fontSize: 13, color: '#374151' }}>Password</label>
          <input type="password" className="form-control" style={{ borderRadius: 10, padding: '10px 14px', fontSize: 14 }} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn w-100 fw-semibold" style={{ background: '#1a6b3c', color: '#fff', borderRadius: 10, padding: '11px', fontSize: 14 }} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#64748b', marginBottom: 0 }}>
        New vendor? <button type="button" onClick={onSwitchToRegister} className="btn btn-link p-0 fw-bold" style={{ color: '#1a6b3c', fontSize: 13, textDecoration: 'none' }}>Register here</button>
      </p>
    </div>
  );
}

