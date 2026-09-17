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
    <div className="sv-demo-bar">
      <div className="sv-demo-bar-left">
        <span className="sv-demo-status-dot"></span>
        <span className="sv-demo-status-label">PUBLIC SHOWCASE MODE</span>
        <span className="sv-demo-divider">•</span>
        <span className="sv-demo-actor">
          Active Role: <strong>{isVendor ? "Rahim Uddin (Merchant · Spot M10-04)" : "Tanvir Ahmed (Municipal Licensing Officer)"}</strong>
        </span>
      </div>

      <div className="sv-demo-bar-right">
        <button
          onClick={handleRoleToggle}
          className="sv-demo-btn-switch"
          title={`Switch role to ${isVendor ? 'Municipal Officer' : 'Licensed Merchant'}`}
        >
          {isVendor ? 'Switch to Officer View →' : 'Switch to Merchant View →'}
        </button>

        <button
          onClick={handleExit}
          className="sv-demo-btn-exit"
          title="Exit showcase and return to landing page"
        >
          Exit Demo
        </button>
      </div>

      <style>{`
        .sv-demo-bar {
          height: 36px;
          background: linear-gradient(90deg, #0B2828 0%, #163838 50%, #1E4A4A 100%);
          border-bottom: 1px solid rgba(168, 207, 207, 0.35);
          color: #FFFFFF;
          font-size: 12px;
          font-family: var(--sv-font-sans, 'Space Grotesk', sans-serif);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
        }

        .sv-demo-bar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sv-demo-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #5DBBBB;
          display: inline-block;
          box-shadow: 0 0 6px #5DBBBB;
          animation: sv-pulse-demo 2s ease-in-out infinite;
        }

        @keyframes sv-pulse-demo {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #5DBBBB; }
          50%       { opacity: 0.7; box-shadow: 0 0 12px #9EE2E2; }
        }

        .sv-demo-status-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #A8CFCF;
          text-transform: uppercase;
        }

        .sv-demo-divider {
          color: rgba(168, 207, 207, 0.4);
        }

        .sv-demo-actor {
          font-size: 12px;
          color: rgba(239, 233, 225, 0.92);
          font-weight: 500;
        }

        .sv-demo-bar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sv-demo-btn-switch {
          font-family: var(--sv-font-sans, inherit);
          font-size: 11.5px;
          font-weight: 700;
          color: #1E4A4A;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.6);
          padding: 4px 12px;
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.15s ease;
          letter-spacing: -0.01em;
        }
        .sv-demo-btn-switch:hover {
          background: #FFFFFF;
          box-shadow: 0 2px 8px rgba(30, 74, 74, 0.25);
        }

        .sv-demo-btn-exit {
          font-family: var(--sv-font-sans, inherit);
          font-size: 11.5px;
          font-weight: 500;
          color: rgba(209, 199, 189, 0.9);
          background: transparent;
          border: 1px solid rgba(168, 207, 207, 0.3);
          padding: 4px 10px;
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sv-demo-btn-exit:hover {
          color: #FFFFFF;
          border-color: rgba(168, 207, 207, 0.7);
          background: rgba(255, 255, 255, 0.08);
        }

        @media (max-width: 640px) {
          .sv-demo-actor { display: none; }
        }
      `}</style>
    </div>
  );
}
