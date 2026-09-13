import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DemoBanner() {
  const { isDemo, demoRole, switchDemoRole, exitDemoMode } = useAuth();
  const navigate = useNavigate();

  if (!isDemo) return null;

  const isVendor = demoRole === 'vendor';

  const handleRoleToggle = () => {
    const nextRole = isVendor ? 'admin' : 'vendor';
    switchDemoRole(nextRole);
    navigate(nextRole === 'admin' ? '/admin' : '/vendor');
  };

  const handleExit = () => {
    exitDemoMode();
    navigate('/home');
  };

  return (
    <div className="sv-demo-banner d-flex align-items-center justify-content-between px-3 py-2">
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <span className="sv-demo-pill">
          <span className="sv-pulse-dot"></span>
          PUBLIC SHOWCASE DEMO
        </span>
        <span className="sv-demo-identity d-none d-sm-inline">
          Active Role: <strong>{isVendor ? "Rahim's Tea & Snacks (Vendor)" : "City Licensing Officer (Admin)"}</strong>
        </span>
      </div>

      <div className="d-flex align-items-center gap-2">
        <button
          onClick={handleRoleToggle}
          className="btn btn-sm sv-demo-switch-btn d-flex align-items-center gap-1"
          title={`Switch view to ${isVendor ? 'Administrator Control Panel' : 'Vendor Operations Dashboard'}`}
        >
          <span>{isVendor ? '🔑 Switch to Admin View' : '🛒 Switch to Vendor View'}</span>
        </button>

        <button
          onClick={handleExit}
          className="btn btn-sm btn-outline-light sv-demo-exit-btn"
          title="Exit demo mode and return to landing page"
        >
          ✕ Exit Demo
        </button>
      </div>

      <style>{`
        .sv-demo-banner {
          background: linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          border-bottom: 1px solid rgba(245, 158, 11, 0.4);
          color: #fff;
          font-size: 12px;
          z-index: 1050;
          position: sticky;
          top: 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }

        .sv-demo-pill {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.4);
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .sv-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          animation: svDotPulse 1.8s infinite;
        }

        @keyframes svDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        .sv-demo-identity {
          color: rgba(255, 255, 255, 0.85);
          font-size: 12px;
        }

        .sv-demo-switch-btn {
          background: #f59e0b;
          color: #0f172a;
          border: none;
          font-weight: 700;
          font-size: 11px;
          padding: 4px 12px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .sv-demo-switch-btn:hover {
          background: #fbbf24;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
        }

        .sv-demo-exit-btn {
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 8px;
          opacity: 0.75;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .sv-demo-exit-btn:hover {
          opacity: 1;
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
          color: #fca5a5;
        }
      `}</style>
    </div>
  );
}
