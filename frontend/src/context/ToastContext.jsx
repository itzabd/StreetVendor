import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="sv-toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`sv-toast sv-toast-${toast.type} slide-in-bottom`}>
            <div className="d-flex align-items-center gap-2">
              <span>{toast.type === 'success' ? '✅' : toast.type === 'danger' ? '🚨' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
              <span>{toast.message}</span>
            </div>
            <button className="sv-toast-close" onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
