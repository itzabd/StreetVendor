import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// role: 'admin' | 'vendor' | null (just authenticated)
export default function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Force onboarding for vendors if not completed
  // (Assuming /onboarding is the route for the onboarding page)
  const isVendor = profile?.role === 'vendor';
  const needsOnboarding = isVendor && !profile?.onboarding_completed;
  
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

  // If we are at /vendor and profile is missing, something is wrong, but don't loop
  if (!profile && window.location.pathname !== '/login' && window.location.pathname !== '/home') {
     // Optional: show error or handle gracefully. For now, we trust loading handled it.
  }

  return children;
}
