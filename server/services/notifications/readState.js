const mongoose = require("mongoose");

function toObjectId(userId) {
  return userId instanceof mongoose.Types.ObjectId
    ? userId
    : new mongoose.Types.ObjectId(userId);
}

function hasUserRead(doc, userId) {
  if (!doc) return false;
  const uid = userId?.toString?.() || String(userId);
  return (doc.readBy || []).some((id) => id.toString() === uid);
}

function unreadFilterForUser(userId) {
  return { readBy: { $nin: [toObjectId(userId)] } };
}

module.exports = {
  toObjectId,
  hasUserRead,
  unreadFilterForUser,
};
