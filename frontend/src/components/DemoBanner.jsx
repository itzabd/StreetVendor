import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DemoBanner() {
  const { isDemo, demoRole, switchDemoRole, exitDemoMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDemo) {
      document.body.classList.add('has-sv-demo-banner');
    } else {
      document.body.classList.remove('has-sv-demo-banner');
    }
    return () => {
      document.body.classList.remove('has-sv-demo-banner');
    };
  }, [isDemo]);

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
      <div className="d-flex align-items-center gap-3 flex-wrap">
        <span className="sv-demo-stamp">
          <span className="sv-pulse-square"></span>
          OFFICIAL DEMO AUDIT SESSION
        </span>
        <span className="sv-demo-identity d-none d-sm-inline font-monospace">
          ACTIVE ACTOR: <strong>{isVendor ? "Rahim Uddin (Mirpur Spot M10-04 • Merchant)" : "Tanvir Ahmed (City Licensing Officer • Admin)"}</strong>
        </span>
      </div>

      <div className="d-flex align-items-center gap-2">
        <button
          onClick={handleRoleToggle}
          className="btn btn-sm sv-demo-switch-btn d-flex align-items-center gap-1 font-monospace"
          title={`Switch view to ${isVendor ? 'Administrator Control Panel' : 'Vendor Operations Dashboard'}`}
        >
          <span>{isVendor ? '🔑 Switch to Officer Desk' : '🛒 Switch to Merchant Desk'}</span>
        </button>

        <button
          onClick={handleExit}
          className="btn btn-sm sv-demo-exit-btn font-monospace"
          title="Exit demo mode and return to public ledger"
        >
          ✕ Exit Session
        </button>
      </div>

      <style>{`
        .sv-demo-banner {
          background: #08261A;
          border-bottom: 2px solid #C58A2B;
          color: #F7F5EE;
          font-size: 12px;
          z-index: 2100;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 38px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .sv-demo-stamp {
          background: #FFF7E6;
          color: #8C580B;
          border: 1px solid #C58A2B;
          padding: 2px 8px;
          font-family: var(--sv-font-mono, monospace);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .sv-pulse-square {
          width: 7px;
          height: 7px;
          background: #0D6942;
          display: inline-block;
          animation: svSquareBlink 1.5s infinite;
        }

        @keyframes svSquareBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }

        .sv-demo-identity {
          color: rgba(247, 245, 238, 0.9);
          font-size: 11.5px;
          letter-spacing: 0.02em;
        }

        .sv-demo-switch-btn {
          background: #C58A2B;
          color: #141716;
          border: 1px solid #141716;
          font-weight: 700;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 2px;
          transition: all 0.15s ease;
        }

        .sv-demo-switch-btn:hover {
          background: #E0A444;
          transform: translate(-1px, -1px);
        }

        .sv-demo-exit-btn {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 2px;
          background: transparent;
          color: #F7F5EE;
          border: 1px solid rgba(247, 245, 238, 0.35);
        }

        .sv-demo-exit-btn:hover {
          background: #C8372D;
          border-color: #C8372D;
          color: #FFF;
        }
      `}</style>
    </div>
  );
}
