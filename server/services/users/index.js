const selfProfile = require("./selfProfile");
const userAdminService = require("./userAdminService");
const wishlistService = require("./wishlistService");

module.exports = {
  ...selfProfile,
  ...userAdminService,
  ...wishlistService,
};
