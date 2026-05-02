const crypto = require('crypto');
const { getClientIp } = require('../../utils/requestIp');

/**
 * Generate a unique device fingerprint
 * @param {String} userAgent - Browser user agent
 * @param {String} ipAddress - User IP address
 * @returns {String} - Device fingerprint hash
 */
const generateDeviceId = (userAgent, ipAddress) => {
  const data = `${userAgent || ''}-${ipAddress || ''}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Check if device is trusted
 * @param {Object} user - User object
 * @param {String} deviceId - Device fingerprint
 * @returns {Boolean} - True if device is trusted and not expired
 */
const isDeviceTrusted = (user, deviceId) => {
  if (!user.trustedDevices || user.trustedDevices.length === 0) {
    return false;
  }

  const trustedDevice = user.trustedDevices.find(
    device => device.deviceId === deviceId && new Date(device.expiresAt) > new Date()
  );

  return !!trustedDevice;
};

/**
 * Add trusted device
 * @param {Object} user - User object
 * @param {String} deviceId - Device fingerprint
 * @param {String} deviceName - Device name (optional)
 * @param {String} userAgent - Browser user agent (optional)
 * @param {String} ipAddress - User IP address (optional)
 * @param {Number} days - Number of days to trust (default: 30)
 */
const addTrustedDevice = (user, deviceId, deviceName = 'Unknown Device', userAgent = '', ipAddress = '', days = 30) => {
  // Remove expired devices first
  user.trustedDevices = user.trustedDevices.filter(
    device => new Date(device.expiresAt) > new Date()
  );

  // Check if device already exists
  const existingDeviceIndex = user.trustedDevices.findIndex(
    device => device.deviceId === deviceId
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  if (existingDeviceIndex >= 0) {
    // Update existing device
    user.trustedDevices[existingDeviceIndex].deviceName = deviceName;
    user.trustedDevices[existingDeviceIndex].userAgent = userAgent;
    user.trustedDevices[existingDeviceIndex].ipAddress = ipAddress;
    user.trustedDevices[existingDeviceIndex].trustedAt = new Date();
    user.trustedDevices[existingDeviceIndex].expiresAt = expiresAt;
  } else {
    // Add new device
    user.trustedDevices.push({
      deviceId,
      deviceName,
      userAgent,
      ipAddress,
      trustedAt: new Date(),
      expiresAt
    });
  }
};

/**
 * Remove trusted device
 * @param {Object} user - User object
 * @param {String} deviceId - Device fingerprint
 */
const removeTrustedDevice = (user, deviceId) => {
  user.trustedDevices = user.trustedDevices.filter(
    device => device.deviceId !== deviceId
  );
};

/**
 * Remove all trusted devices
 * @param {Object} user - User object
 */
const removeAllTrustedDevices = (user) => {
  user.trustedDevices = [];
};

/**
 * Get device info from request
 * @param {Object} req - Express request object
 * @returns {Object} - Device information
 */
const getDeviceInfo = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '';
  const deviceId = generateDeviceId(userAgent, ipAddress);
  
  // Try to get device name from request body, or generate from user agent
  let deviceName = req.body?.deviceName;
  if (!deviceName) {
    // Try to extract browser/OS info from user agent
    if (userAgent.includes('Chrome')) deviceName = 'Chrome Browser';
    else if (userAgent.includes('Firefox')) deviceName = 'Firefox Browser';
    else if (userAgent.includes('Safari')) deviceName = 'Safari Browser';
    else if (userAgent.includes('Edge')) deviceName = 'Edge Browser';
    else deviceName = 'Unknown Device';
  }

  return {
    deviceId,
    deviceName,
    userAgent,
    ipAddress
  };
};

module.exports = {
  generateDeviceId,
  isDeviceTrusted,
  addTrustedDevice,
  removeTrustedDevice,
  removeAllTrustedDevices,
  getDeviceInfo
};
