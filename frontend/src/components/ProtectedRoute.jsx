import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// role: 'admin' | 'vendor' | null (just authenticated)
export default function ProtectedRoute({ children, role }) {
  const { user, profile, loading, isDemo } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <div className="text-center">
          <div className="spinner-border text-success mb-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-muted small fw-bold">Loading StreetVendor BD...</div>
        </div>
      </div>
    );
  }

  if (!user && !isDemo) return <Navigate to="/home?mode=login" replace />;

  // Force onboarding for real registered vendors if not completed (bypassed in demo mode)
  const isVendor = profile?.role === 'vendor';
  const needsOnboarding = !isDemo && isVendor && !profile?.onboarding_completed;
  
  if (needsOnboarding && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Already onboarded vendors shouldn't go back to onboarding
  if (!needsOnboarding && window.location.pathname === '/onboarding') {
    return <Navigate to="/vendor" replace />;
  }

  if (role && profile && profile.role !== role) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/vendor'} replace />;
  }

  return children;
}

