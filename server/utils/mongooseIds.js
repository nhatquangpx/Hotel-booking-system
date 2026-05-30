const mongoose = require("mongoose");

function isValidObjectId(id) {
  return Boolean(id != null && String(id).length > 0 && mongoose.Types.ObjectId.isValid(id));
}

/** ObjectId ref hoặc document đã populate → chuỗi id để so sánh */
function toIdString(ref) {
  if (ref == null) return "";
  if (typeof ref === "object") {
    if (ref._id != null) return String(ref._id);
    if (ref.id != null) return String(ref.id);
  }
  return String(ref);
}

function refIdsMatch(ref, otherId) {
  const a = toIdString(ref);
  const b = toIdString(otherId);
  if (!isValidObjectId(a) || !isValidObjectId(b)) {
    return false;
  }
  return a === b;
}

module.exports = { isValidObjectId, toIdString, refIdsMatch };
