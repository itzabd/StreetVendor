import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthModal({ isOpen, initialMode = 'login', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode);

  // Reset mode to initialMode when modal opens
  useEffect(() => {
    if (isOpen) setMode(initialMode);
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  return (
    <div className="sv-modal-backdrop" onClick={onClose}>
      <div className="sv-modal-content auth-modal" onClick={e => e.stopPropagation()}>
        <button className="sv-modal-close" onClick={onClose}>✕</button>
        
        <div className="d-flex flex-column flex-md-row">
          {/* Decorative Side Panel */}
          <div className="auth-modal-side d-none d-md-flex">
            <div className="mt-auto">
              <div style={{ fontSize: 32, marginBottom: 12 }}>🛒</div>
              <h4 className="fw-800 text-white mb-2">StreetVendor BD</h4>
              <p className="text-white-50 small mb-0">Digital Identity & Management platform for Bangladesh street vendors.</p>
            </div>
          </div>

          {/* Form Area */}
          <div className="auth-modal-main p-4 p-md-5 flex-grow-1">
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
