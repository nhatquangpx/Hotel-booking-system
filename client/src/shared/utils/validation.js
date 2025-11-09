/**
 * Validation Utilities
 * Common validation functions
 */

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Vietnamese format)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};

/**
 * Validate date range
 */
export const isValidDateRange = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return false;
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  return checkOutDate > checkInDate;
};

