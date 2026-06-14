import React from "react";
import ExpandableText from "./ExpandableText";

const ReplyContactModal = ({
  message,
  replyText,
  isSendingReply,
  expandedSections,
  onClose,
  onChangeReplyText,
  onSendReply,
  onToggleExpanded,
}) => {
  if (!message) return null;

  return (
    <div className="reply-modal-overlay" onClick={onClose}>
      <div className="reply-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Phản hồi liên hệ</h3>
        <div className="reply-modal__info">
          <p>
            <strong>Người nhận:</strong> {message.name} - {message.email}
          </p>
          <p>
            <strong>Tiêu đề liên hệ:</strong> {message.subject}
          </p>
        </div>
        <div className="reply-modal__original">
          <label>Nội dung người dùng gửi</label>
          <ExpandableText
            text={message.message}
            limit={320}
            isExpanded={!!expandedSections[`modal-original-${message._id}`]}
            onToggle={() => onToggleExpanded(`modal-original-${message._id}`)}
          />
        </div>
        <div className="reply-modal__composer">
          <label htmlFor="replyMessage">Nội dung phản hồi</label>
          <textarea
            id="replyMessage"
            rows="7"
            value={replyText}
            onChange={(e) => onChangeReplyText(e.target.value)}
            placeholder="Nhập nội dung phản hồi cho người dùng..."
            disabled={isSendingReply}
          />
        </div>
        <div className="reply-modal__actions">
          <button type="button" className="cancel-btn" onClick={onClose} disabled={isSendingReply}>
            Hủy
          </button>
          <button type="button" className="send-btn" onClick={onSendReply} disabled={isSendingReply}>
            {isSendingReply ? "Đang gửi..." : "Gửi phản hồi"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplyContactModal;
