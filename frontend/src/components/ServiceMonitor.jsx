import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ServiceMonitor() {
  const { serviceStatus } = useAuth();
  const { addToast, removeToast } = useToast();
  const toastIdRef = useRef(null);

  const isError = serviceStatus.database === 'error' || serviceStatus.api === 'error';

  useEffect(() => {
    if (isError) {
      if (!toastIdRef.current) {
        let message = "We're experiencing a temporary connection issue. ";
        if (serviceStatus.database === 'error' && serviceStatus.api === 'error') {
          message += "Both our Database and API services are unreachable.";
        } else if (serviceStatus.database === 'error') {
          message += "The Database is currently unreachable.";
        } else {
          message += "The Backend API is currently unreachable.";
        }
        message += " We apologize for the inconvenience.";

        toastIdRef.current = addToast(message, "danger", 0);
      }
    } else {
      if (toastIdRef.current) {
        removeToast(toastIdRef.current);
        toastIdRef.current = null;
        addToast("Connection restored. All services are back online.", "success", 3000);
      }
    }
  }, [isError, serviceStatus, addToast, removeToast]);

  return null;
}
