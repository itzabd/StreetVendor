import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Zones from './pages/Zones';
import Blocks from './pages/Blocks';
import Spots from './pages/Spots';
import Applications from './pages/Applications';
import Assignments from './pages/Assignments';
import Permissions from './pages/Permissions';
import Complaints from './pages/Complaints';
import RentRecords from './pages/RentRecords';
import Profile from './pages/Profile';
import ServiceMonitor from './components/ServiceMonitor';

function Layout({ children }) {
  return (
    <>
      <Sidebar />
      <Navbar />
      <main className="sv-main">
        {children}
      </main>
    </>
  );
}

function RootRedirect() {
  const { user, profile, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
        <div style={{ color: '#1a6b3c', fontWeight: 600 }}>StreetVendor BD</div>
        <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>Loading...</div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/home" replace />;
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/vendor" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <ServiceMonitor />
          <BrowserRouter>
            <Routes>
            <Route path="/home" element={<LandingPage />} />
            <Route path="/login" element={<Navigate to="/home?mode=login" replace />} />
            <Route path="/register" element={<Navigate to="/home?mode=register" replace />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Vendor Routes */}
            <Route path="/vendor" element={<ProtectedRoute role="vendor"><Layout><VendorDashboard /></Layout></ProtectedRoute>} />
            <Route path="/vendor/applications" element={<ProtectedRoute role="vendor"><Layout><Applications /></Layout></ProtectedRoute>} />
            <Route path="/vendor/assignments" element={<ProtectedRoute role="vendor"><Layout><Assignments /></Layout></ProtectedRoute>} />
            <Route path="/vendor/permissions" element={<ProtectedRoute role="vendor"><Layout><Permissions /></Layout></ProtectedRoute>} />
            <Route path="/vendor/complaints" element={<ProtectedRoute role="vendor"><Layout><Complaints /></Layout></ProtectedRoute>} />
            <Route path="/vendor/rent" element={<ProtectedRoute role="vendor"><Layout><RentRecords /></Layout></ProtectedRoute>} />
            <Route path="/vendor/profile" element={<ProtectedRoute role="vendor"><Layout><Profile /></Layout></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute role="admin"><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
            <Route path="/admin/zones" element={<ProtectedRoute role="admin"><Layout><Zones /></Layout></ProtectedRoute>} />
            <Route path="/admin/blocks" element={<ProtectedRoute role="admin"><Layout><Blocks /></Layout></ProtectedRoute>} />
            <Route path="/admin/spots" element={<ProtectedRoute role="admin"><Layout><Spots /></Layout></ProtectedRoute>} />
            <Route path="/admin/applications" element={<ProtectedRoute role="admin"><Layout><Applications /></Layout></ProtectedRoute>} />
            <Route path="/admin/assignments" element={<ProtectedRoute role="admin"><Layout><Assignments /></Layout></ProtectedRoute>} />
            <Route path="/admin/permissions" element={<ProtectedRoute role="admin"><Layout><Permissions /></Layout></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute role="admin"><Layout><Complaints /></Layout></ProtectedRoute>} />
            <Route path="/admin/rent" element={<ProtectedRoute role="admin"><Layout><RentRecords /></Layout></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute role="admin"><Layout><Profile /></Layout></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
