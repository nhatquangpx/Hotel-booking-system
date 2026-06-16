import React from "react";
import { formatDateTime } from "@/shared/utils";
import ExpandableText from "./ExpandableText";

const ContactMessagesTable = ({
  loading,
  messages,
  expandedSections,
  onToggleExpanded,
  onMarkAsRead,
  onOpenReplyModal,
  onDelete,
}) => {
  return (
    <div className="contact-table-wrapper">
      <table className="contact-table">
        <thead>
          <tr>
            <th>Thời gian gửi</th>
            <th>Người gửi</th>
            <th>Email / SĐT</th>
            <th>Tiêu đề</th>
            <th>Nội dung</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="7" className="table-state">
                Đang tải...
              </td>
            </tr>
          ) : messages.length === 0 ? (
            <tr>
              <td colSpan="7" className="table-state">
                Không có tin nhắn liên hệ nào.
              </td>
            </tr>
          ) : (
            messages.map((item) => (
              <tr key={item._id} className={!item.isRead ? "row-unread" : ""}>
                <td>{formatDateTime(item.createdAt)}</td>
                <td>{item.name}</td>
                <td>
                  <div>{item.email}</div>
                  <div className="phone">{item.phone || "-"}</div>
                </td>
                <td>{item.subject}</td>
                <td className="message-cell">
                  <ExpandableText
                    text={item.message}
                    limit={160}
                    isExpanded={!!expandedSections[`table-message-${item._id}`]}
                    onToggle={() => onToggleExpanded(`table-message-${item._id}`)}
                  />
                </td>
                <td>
                  <span className={`status-badge ${item.isRead ? "active" : "pending"}`}>
                    {item.isRead ? "Đã đọc" : "Chưa đọc"}
                  </span>
                  {item.isRead && item.readAt && (
                    <div className="read-meta">{formatDateTime(item.readAt)}</div>
                  )}
                  {item.repliedAt && (
                    <div className="reply-meta">Đã phản hồi: {formatDateTime(item.repliedAt)}</div>
                  )}
                </td>
                <td>
                  <div className="action-group">
                    {!item.isRead && (
                      <button type="button" className="mark-read-btn" onClick={() => onMarkAsRead(item._id)}>
                        Đánh dấu đã đọc
                      </button>
                    )}
                    <button type="button" className="reply-btn" onClick={() => onOpenReplyModal(item)}>
                      Phản hồi
                    </button>
                    <button type="button" className="delete-btn" onClick={() => onDelete(item)}>
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ContactMessagesTable;
