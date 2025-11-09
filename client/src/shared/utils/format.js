/**
 * Format Utilities
 * Common formatting functions
 */

/**
 * Format currency to VND
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0 VNĐ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

/**
 * Format date to Vietnamese format
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  const defaultOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('vi-VN', { ...defaultOptions, ...options });
};

/**
 * Format date and time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculate number of nights between two dates
 */
export const calculateNights = (checkIn, checkOut) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = Math.abs(checkOutDate - checkInDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

