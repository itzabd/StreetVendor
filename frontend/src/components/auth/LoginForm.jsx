import { useState } from 'react';
import supabase from '../../supabaseClient';

export default function LoginForm({ onSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (onSuccess) onSuccess();
  }

  return (
    <div className="auth-form-container">
      <h3 style={{ fontWeight: 800, fontSize: 22, color: '#1a2c1e', marginBottom: 4 }}>Welcome back</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 28 }}>Sign in to your account</p>

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
