const crypto = require('crypto');

/**
 * Generate a 6-digit OTP code
 * @returns {String} - 6-digit OTP code
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Generate backup codes for 2FA
 * @param {Number} count - Number of backup codes to generate (default: 10)
 * @returns {Array} - Array of backup code objects
 */
const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push({
      code,
      used: false
    });
  }
  return codes;
};

/**
 * Verify OTP code
 * @param {String} inputCode - Code entered by user
 * @param {String} storedCode - Code stored in database
 * @param {Date} expiresAt - Expiration time
 * @returns {Boolean} - True if valid
 */
const verifyOTP = (inputCode, storedCode, expiresAt) => {
  if (!inputCode || !storedCode) {
    return false;
  }

  // Check if expired
  if (expiresAt && new Date() > new Date(expiresAt)) {
    return false;
  }

  // Compare codes (case insensitive)
  return inputCode.trim() === storedCode.trim();
};

/**
 * Check if role requires 2FA
 * @param {String} role - User role
 * @returns {Boolean} - True if role requires 2FA
 */
const requires2FA = (role) => {
  return role === 'admin' || role === 'owner';
};

module.exports = {
  generateOTP,
  generateBackupCodes,
  verifyOTP,
  requires2FA
};
