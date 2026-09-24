import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="sv-auth-page-wrapper">
      <div className="sv-glass-auth-card">
        {/* Top Header with Back to Home button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="sv-auth-back-btn"
            title="Return to StreetVendor BD Homepage"
          >
            ← Back to Home
          </button>
          <div className="sv-telemetry-badge" style={{ fontSize: '10.5px', padding: '3px 9px' }}>
            <span className="sv-pulse-dot" style={{ width: '6px', height: '6px' }}></span>
            <span>SECURE GIS</span>
          </div>
        </div>

        <LoginForm 
          onSuccess={() => navigate('/')} 
          onSwitchToRegister={() => navigate('/register')} 
        />
      </div>
    </div>
  );
}
