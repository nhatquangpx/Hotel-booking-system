const authService = require("./authService");
const twoFactorAuth = require("./twoFactorAuth");
const deviceAuth = require("./deviceAuth");
const twoFactorManagement = require("./twoFactorManagementService");

module.exports = {
  ...authService,
  ...twoFactorAuth,
  ...deviceAuth,
  ...twoFactorManagement,
};
