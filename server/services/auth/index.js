/**
 * Authentication Services
 * Centralized exports for 2FA and device authentication
 */

const twoFactorAuth = require('./twoFactorAuth');
const deviceAuth = require('./deviceAuth');

module.exports = {
  ...twoFactorAuth,
  ...deviceAuth
};
