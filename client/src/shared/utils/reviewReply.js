export const REVIEW_REPLY_ROLE_LABEL = {
  owner: 'Chủ khách sạn',
  staff: 'Nhân viên khách sạn',
};

/** @returns {{ text: string, at?: string, role: string, roleLabel: string, responderName: string } | null} */
export function getHotelReply(review) {
  const text = review?.ownerResponse != null ? String(review.ownerResponse).trim() : '';
  if (!text) return null;

  const role = review.replyRole === 'staff' ? 'staff' : 'owner';
  const roleLabel = review.replyRoleLabel || REVIEW_REPLY_ROLE_LABEL[role];
  const responderName =
    review.replyResponderName ||
    (review.replyBy && typeof review.replyBy === 'object' ? review.replyBy.name : '') ||
    '';

  return {
    text,
    at: review.ownerResponseAt,
    role,
    roleLabel,
    responderName: responderName ? String(responderName).trim() : '',
  };
}

/** Nhãn hiển thị: «Tên (Vai trò)» hoặc «(Vai trò)» nếu không có tên. */
export function formatReplyResponderLabel(reply) {
  if (!reply) return '';
  const rolePart = `(${reply.roleLabel})`;
  if (reply.responderName) {
    return `${reply.responderName} ${rolePart}`;
  }
  return rolePart;
}
