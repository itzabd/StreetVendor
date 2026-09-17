import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthModal({ isOpen, initialMode = 'login', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  if (isOpen && !prevOpen) {
    setPrevOpen(true);
    setMode(initialMode);
  } else if (!isOpen && prevOpen) {
    setPrevOpen(false);
  }

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(11, 24, 18, 0.75)',
        backdropFilter: 'blur(6px)'
      }}
      onClick={onClose}
    >
      <div 
        className="sv-card" 
        style={{
          maxWidth: '840px',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          boxShadow: 'var(--sv-shadow-lg)',
          position: 'relative',
          padding: 0
        }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            fontSize: '18px',
            color: 'var(--sv-text-muted)',
            cursor: 'pointer',
            zIndex: 10
          }}
          aria-label="Close modal"
        >
          ✕
        </button>
        
        <div style={{ display: 'flex', width: '100%' }}>
          {/* Decorative Side Panel */}
          <div 
            className="d-none d-md-flex"
            style={{
              width: '320px',
              backgroundColor: 'var(--sv-primary)',
              color: '#FFFFFF',
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              flexShrink: 0
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85, marginBottom: '6px' }}>
                ⚖️ DHAKA MUNICIPAL CORPORATION
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px' }}>
                Digital Trade Ledger
              </h3>
              <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
                Authoritative spatial demarcation, vendor licensing, and civic governance for metropolitan street merchants.
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Citizen Helpline
              </div>
              <div className="sv-mono-data" style={{ fontSize: '13px', fontWeight: 700 }}>
                Police: 999 · Health: 16263
              </div>
            </div>
          </div>

          {/* Form Area */}
          <div style={{ flex: 1, padding: '36px 32px', backgroundColor: 'var(--sv-surface)' }}>
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
    </div>
  );
}

