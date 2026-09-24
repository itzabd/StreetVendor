import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthModal({ isOpen, initialMode = 'login', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      // Lock body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  return (
    <div 
      className="sv-auth-backdrop"
      onClick={onClose}
    >
      <div 
        className="sv-glass-auth-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="sv-modal-top-bar">
          <button 
            type="button"
            onClick={onClose}
            className="sv-auth-back-btn"
            title="Return to StreetVendor BD"
          >
            ← Back to Home
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--sv-primary)', letterSpacing: '-0.02em' }}>
              StreetVendor BD
            </span>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="sv-modal-close-btn"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="sv-auth-mode-segmented">
          <button
            type="button"
            className={`sv-auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            🔐 Sign In to Portal
          </button>
          <button
            type="button"
            className={`sv-auth-mode-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            ✨ Register as Vendor
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="sv-modal-body-scroll">
          {mode === 'login' ? (
            <LoginForm 
              onSuccess={onSuccess} 
              onSwitchToRegister={() => setMode('register')} 
            />
          ) : (
            <RegisterForm 
              onSuccess={onSuccess} 
              onSwitchToLogin={() => setMode('login')} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
