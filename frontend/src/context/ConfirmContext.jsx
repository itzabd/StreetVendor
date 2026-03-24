import { createContext, useContext, useState } from 'react';

const ConfirmContext = createContext();

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState({ 
    title: 'Confirm Action', 
    message: 'Are you sure?', 
    confirmText: 'Confirm', 
    cancelText: 'Cancel', 
    onConfirm: null 
  });

  const confirmAction = ({ title, message, confirmText, cancelText, onConfirm }) => {
    setOptions(prev => ({
      title: title || prev.title,
      message: message || prev.message,
      confirmText: confirmText || 'Confirm',
      cancelText: cancelText || 'Cancel',
      onConfirm
    }));
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (options.onConfirm) options.onConfirm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirmAction }}>
      {children}
      {isOpen && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
          <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg border-0" style={{ borderRadius: 12 }}>
                <div className="modal-header border-bottom-0 pb-0">
                  <h5 className="modal-title fw-bold text-dark">{options.title}</h5>
                  <button type="button" className="btn-close" onClick={handleCancel}></button>
                </div>
                <div className="modal-body py-4 text-secondary" style={{ fontSize: 15 }}>
                  {options.message}
                </div>
                <div className="modal-footer border-top-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={handleCancel} style={{ borderRadius: 8, fontWeight: 500 }}>{options.cancelText}</button>
                  <button type="button" className="btn btn-danger" onClick={handleConfirm} style={{ borderRadius: 8, fontWeight: 600 }}>{options.confirmText}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </ConfirmContext.Provider>
  );
}
