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
      <h3 style={{ fontWeight: 700, fontSize: '20px', color: 'var(--sv-text-primary)', marginBottom: '4px' }}>
        Sign In to Portal
      </h3>
      <p style={{ color: 'var(--sv-text-muted)', fontSize: '13px', marginBottom: '16px' }}>
        Access your merchant dashboard or municipal administrative desk
      </p>

      {/* Instant Demo Quick Access */}
      <div style={{
        padding: '14px',
        background: 'linear-gradient(135deg, rgba(238,242,255,0.9) 0%, rgba(245,243,255,0.7) 100%)',
        border: '1.5px solid var(--sv-primary-border)',
        borderRadius: 'var(--sv-radius-lg)',
        marginBottom: '18px',
        backdropFilter: 'blur(8px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-15px', right: '-15px',
          width: '70px', height: '70px',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--sv-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⚡ Instant Showcase Access — No Signup
          </span>
          <span className="sv-badge sv-badge-primary" style={{ fontSize: '9px' }}>
            LIVE
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
          OR USE ACCOUNT
        </span>
        <div style={{ flex: 1, height: 1, backgroundColor: 'var(--sv-border)' }}></div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '12.5px', borderRadius: 'var(--sv-radius)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
            Email Address
          </label>
          <input 
            type="email" 
            className="form-control" 
            placeholder="operator@dhakacity.gov.bd" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            autoFocus 
          />
        </div>
        <div className="mb-4">
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--sv-text-secondary)', marginBottom: '4px' }}>
            Password
          </label>
          <input 
            type="password" 
            className="form-control" 
            placeholder="••••••••" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary w-100" 
          disabled={loading}
          style={{ padding: '9px' }}
        >
          {loading ? 'Authenticating...' : 'Sign In to Account'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12.5px', color: 'var(--sv-text-muted)', marginBottom: 0 }}>
        New vendor in Dhaka? <button type="button" onClick={onSwitchToRegister} className="btn btn-link p-0 fw-bold" style={{ color: 'var(--sv-primary)', fontSize: '12.5px', textDecoration: 'none' }}>Register new account</button>
      </p>
    </div>
  );
}
