import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="sv-auth-page-wrapper">
      <div className="sv-glass-auth-card" style={{ maxWidth: '520px' }}>
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

        <RegisterForm 
          onSuccess={() => navigate('/')} 
          onSwitchToLogin={() => navigate('/login')} 
        />
      </div>
    </div>
  );
}
