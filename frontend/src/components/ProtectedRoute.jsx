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

  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === 'admin' ? '/admin' : '/vendor'} replace />;
  }

  return children;
}
