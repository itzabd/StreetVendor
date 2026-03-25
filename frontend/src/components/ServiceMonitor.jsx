import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ServiceMonitor() {
  const { serviceError } = useAuth();
  const { addToast, removeToast } = useToast();
  const toastIdRef = useRef(null);

  useEffect(() => {
    if (serviceError) {
      if (!toastIdRef.current) {
        toastIdRef.current = addToast(
          "We're experiencing a temporary connection issue with our services. Please try again later. We apologize for the inconvenience.",
          "danger",
          0 // Persistent
        );
      }
    } else {
      if (toastIdRef.current) {
        removeToast(toastIdRef.current);
        toastIdRef.current = null;
        addToast("Connection restored. All services are back online.", "success", 3000);
      }
    }
  }, [serviceError, addToast, removeToast]);

  return null;
}
