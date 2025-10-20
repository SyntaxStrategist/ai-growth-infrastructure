import { useState, useCallback } from 'react';

export type ToastState = {
  message: string;
  show: boolean;
};

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', show: false });

  const showToast = useCallback((message: string, duration: number = 3000) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  return {
    toast,
    setToast,
    showToast,
    hideToast,
  };
}
