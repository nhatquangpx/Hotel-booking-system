const mongoose = require("mongoose");

function isValidObjectId(id) {
  return Boolean(id != null && String(id).length > 0 && mongoose.Types.ObjectId.isValid(id));
}

module.exports = { isValidObjectId };
