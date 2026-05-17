const REVIEW_REPLY_ROLES = ["owner", "staff"];

const REVIEW_REPLY_ROLE_LABEL = {
  owner: "Chủ khách sạn",
  staff: "Nhân viên khách sạn",
};

function getReplyText(review) {
  if (!review) return "";
  return String(review.ownerResponse || "").trim();
}

function getReplyRole(review) {
  const role = review?.replyRole;
  if (role === "staff") return "staff";
  return "owner";
}

function enrichReviewDoc(review) {
  const doc = review?.toObject ? review.toObject({ virtuals: true }) : { ...review };
  const text = getReplyText(doc);
  if (!text) {
    doc.replyRoleLabel = null;
    doc.replyResponderName = null;
    return doc;
  }
  const role = getReplyRole(doc);
  doc.replyRole = role;
  doc.replyRoleLabel = REVIEW_REPLY_ROLE_LABEL[role];
  doc.replyResponderName =
    doc.replyBy && typeof doc.replyBy === "object" && doc.replyBy.name
      ? String(doc.replyBy.name).trim()
      : "";
  return doc;
}

function applyHotelReply(review, { text, userId, role }) {
  review.ownerResponse = text;
  review.ownerResponseAt = new Date();
  review.replyBy = userId;
  review.replyRole = role;
}

function clearHotelReply(review) {
  review.ownerResponse = null;
  review.ownerResponseAt = null;
  review.replyBy = null;
  review.replyRole = null;
}

module.exports = {
  REVIEW_REPLY_ROLES,
  REVIEW_REPLY_ROLE_LABEL,
  getReplyText,
  getReplyRole,
  enrichReviewDoc,
  applyHotelReply,
  clearHotelReply,
};
