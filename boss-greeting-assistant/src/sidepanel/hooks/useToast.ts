/**
 * Toast Hook
 */
import { useState, useCallback } from 'react';
import type { Toast, ToastType } from '../components/Toast';

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = { id, message, type, duration };
    
    console.log('[useToast] showToast:', { id, message, type, duration });
    setToasts(prev => {
      const newToasts = [...prev, newToast];
      console.log('[useToast] toasts updated:', newToasts.length);
      return newToasts;
    });
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    console.log('[useToast] success:', message);
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    console.log('[useToast] error:', message);
    return showToast(message, 'error', duration || 5000); // 错误消息显示更久
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    console.log('[useToast] warning:', message);
    return showToast(message, 'warning', duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    console.log('[useToast] info:', message);
    return showToast(message, 'info', duration);
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}

