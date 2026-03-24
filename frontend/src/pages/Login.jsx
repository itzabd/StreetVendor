import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d3d22 0%, #1a6b3c 60%, #2d8f55 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Left Panel */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', padding: '48px 40px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }} className="d-none d-md-flex">
          <div style={{ fontSize: 40, marginBottom: 20 }}>🛒</div>
          <h2 style={{ fontWeight: 800, fontSize: 26, marginBottom: 12 }}>StreetVendor BD</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
            A digital platform for Bangladesh street vendors. Manage your spot, applications, permissions, and complaints all in one place.
          </p>
          {['Vendor Digital Identity', 'Zone & Spot Management', 'Application Workflow', 'Rent Tracking'].map(f => (
            <div key={f} className="d-flex align-items-center gap-2 mb-2">
              <span style={{ color: '#f59e0b', fontSize: 16 }}>✓</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Right Panel – Form */}
        <div style={{ flex: 1, background: '#fff', padding: '48px 40px' }}>
          <Link to="/" style={{ color: '#1a6b3c', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>← Back to Home</Link>
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

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
            New vendor? <Link to="/register" style={{ color: '#1a6b3c', fontWeight: 600 }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
