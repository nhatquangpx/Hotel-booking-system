import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/features/admin/components";
import api from "@/apis";
import { toast } from "react-toastify";
import ContactMessagesTable from "./components/ContactMessagesTable";
import ReplyContactModal from "./components/ReplyContactModal";
import "./ContactMessageList.scss";

const AdminContactMessageListPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isReadFilter, setIsReadFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyingMessage, setReplyingMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const fetchMessages = async (nextPage = page, nextIsReadFilter = isReadFilter) => {
    try {
      setLoading(true);
      setError("");
      const data = await api.adminContact.getContactMessages({
        page: nextPage,
        limit: pagination.limit,
        isRead: nextIsReadFilter,
      });
      setMessages(data.messages || []);
      setPagination(data.pagination || pagination);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách liên hệ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(1, "");
  }, []);

  const handleFilterChange = async (value) => {
    setIsReadFilter(value);
    setPage(1);
    await fetchMessages(1, value);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.adminContact.markAsRead(id);
      setMessages((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      toast.success("Đã đánh dấu liên hệ là đã đọc.");
    } catch (err) {
      setError(err.message || "Không thể cập nhật trạng thái liên hệ.");
    }
  };

  const openReplyModal = (message) => {
    setReplyingMessage(message);
    setReplyText("");
  };

  const closeReplyModal = () => {
    if (isSendingReply) return;
    setReplyingMessage(null);
    setReplyText("");
  };

  const handleSendReply = async () => {
    if (!replyingMessage) return;
    const trimmedReply = replyText.trim();
    if (!trimmedReply) {
      toast.error("Vui lòng nhập nội dung phản hồi.");
      return;
    }

    try {
      setIsSendingReply(true);
      const response = await api.adminContact.replyMessage(replyingMessage._id, trimmedReply);
      const updatedMessage = response?.contactMessage;

      setMessages((prev) =>
        prev.map((item) => (item._id === replyingMessage._id ? updatedMessage || item : item))
      );
      if (!replyingMessage.isRead) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
      toast.success(response?.message || "Đã gửi phản hồi thành công.");
      closeReplyModal();
    } catch (err) {
      toast.error(err.message || "Không thể gửi phản hồi lúc này.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handlePageChange = async (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === page) return;
    setPage(nextPage);
    await fetchMessages(nextPage, isReadFilter);
  };

  const toggleExpandedSection = (key) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <AdminLayout>
      <div className="admin-contact-page">
        <div className="contact-page-header">
          <div>
            <p>Tin nhắn từ form liên hệ công khai trên website.</p>
          </div>
          <div className="contact-page-header__stats">
            <span className="unread-pill">Chưa đọc: {unreadCount}</span>
            <select value={isReadFilter} onChange={(e) => handleFilterChange(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="false">Chưa đọc</option>
              <option value="true">Đã đọc</option>
            </select>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <ContactMessagesTable
          loading={loading}
          messages={messages}
          expandedSections={expandedSections}
          onToggleExpanded={toggleExpandedSection}
          onMarkAsRead={handleMarkAsRead}
          onOpenReplyModal={openReplyModal}
        />

        <div className="contact-pagination admin-pagination">
          <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>
            Trước
          </button>
          <span>
            Trang {pagination.page} / {pagination.totalPages || 1}
          </span>
          <button
            disabled={page >= (pagination.totalPages || 1)}
            onClick={() => handlePageChange(page + 1)}
          >
            Sau
          </button>
        </div>

        <ReplyContactModal
          message={replyingMessage}
          replyText={replyText}
          isSendingReply={isSendingReply}
          expandedSections={expandedSections}
          onClose={closeReplyModal}
          onChangeReplyText={setReplyText}
          onSendReply={handleSendReply}
          onToggleExpanded={toggleExpandedSection}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminContactMessageListPage;
