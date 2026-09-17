import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';

export default function Register() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--sv-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="sv-card" style={{ maxWidth: '480px', width: '100%', padding: '32px 28px', boxShadow: 'var(--sv-shadow-lg)' }}>
        <div style={{ marginBottom: '16px' }}>
          <Link to="/" style={{ color: 'var(--sv-primary)', fontSize: '12.5px', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ← Return to Spatial Ledger
          </Link>
        </div>
        <RegisterForm 
          onSuccess={() => navigate('/')} 
          onSwitchToLogin={() => navigate('/login')} 
        />
      </div>
    </div>
  );
}
