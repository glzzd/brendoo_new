import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { handleApiError } from '../utils/apiUtils';

export const useErrorHandler = () => {
  const handleError = useCallback((error, defaultMessage = 'Bir xəta baş verdi', showToast = true) => {
    const errorInfo = handleApiError(error, defaultMessage);
    
    // Log error for debugging
    console.error('Error handled:', {
      message: errorInfo.message,
      status: errorInfo.status,
      data: errorInfo.data,
      originalError: error
    });

    // Show toast notification if requested
    if (showToast) {
      if (errorInfo.status === 429) {
        toast.error('Çox sayda sorğu göndərildi. Zəhmət olmasa bir az gözləyin.', {
          duration: 5000,
          icon: '⏳'
        });
      } else if (errorInfo.status === 401) {
        toast.error('Giriş icazəniz yoxdur. Yenidən daxil olun.', {
          duration: 5000,
          icon: '🔒'
        });
      } else if (errorInfo.status === 403) {
        toast.error('Bu əməliyyat üçün icazəniz yoxdur.', {
          duration: 5000,
          icon: '🚫'
        });
      } else if (errorInfo.status === 404) {
        toast.error('Axtarılan məlumat tapılmadı.', {
          duration: 4000,
          icon: '🔍'
        });
      } else if (errorInfo.status >= 500) {
        toast.error('Server xətası baş verdi. Daha sonra cəhd edin.', {
          duration: 6000,
          icon: '🔧'
        });
      } else if (errorInfo.status === 0) {
        toast.error('İnternet bağlantınızı yoxlayın.', {
          duration: 5000,
          icon: '📡'
        });
      } else {
        toast.error(errorInfo.message, {
          duration: 4000,
          icon: '⚠️'
        });
      }
    }

    return errorInfo;
  }, []);

  const handleSuccess = useCallback((message, options = {}) => {
    toast.success(message, {
      duration: 3000,
      icon: '✅',
      ...options
    });
  }, []);

  const handleWarning = useCallback((message, options = {}) => {
    toast(message, {
      duration: 4000,
      icon: '⚠️',
      style: {
        background: '#FEF3C7',
        color: '#92400E',
        border: '1px solid #F59E0B'
      },
      ...options
    });
  }, []);

  const handleInfo = useCallback((message, options = {}) => {
    toast(message, {
      duration: 3000,
      icon: 'ℹ️',
      style: {
        background: '#DBEAFE',
        color: '#1E40AF',
        border: '1px solid #3B82F6'
      },
      ...options
    });
  }, []);

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo
  };
};