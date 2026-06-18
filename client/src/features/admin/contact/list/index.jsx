import React, { useEffect, useState, useCallback, useRef } from "react";
import { Paper, TextField } from "@mui/material";
import { AdminLayout, ConfirmDeleteDialog } from "@/features/admin/components";
import api from "@/apis";
import { toast } from "react-toastify";
import { apiErrorMessage } from "@/shared/utils";
import ContactMessagesTable from "./components/ContactMessagesTable";
import ContactFilterSelector, {
  READ_FILTER_OPTIONS,
  READ_FILTERS,
  REPLIED_FILTER_OPTIONS,
  REPLIED_FILTERS,
} from "./components/ContactFilterSelector";
import ReplyContactModal from "./components/ReplyContactModal";
import Pagination from "@/shared/components/Pagination/Pagination";
import { PAGE_SIZE } from "@/constants/pagination";
import "./ContactMessageList.scss";

const textFieldSx = {
  InputLabelProps: { style: { color: "var(--admin-text)" } },
  InputProps: { style: { color: "var(--admin-text)" } },
};

const PAGE_LIMIT = PAGE_SIZE.ADMIN_CONTACT;

const AdminContactMessageListPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchSubject, setSearchSubject] = useState("");
  const [searchContent, setSearchContent] = useState("");
  const [readFilter, setReadFilter] = useState(READ_FILTERS.ALL);
  const [repliedFilter, setRepliedFilter] = useState(REPLIED_FILTERS.ALL);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const resetPageOnNextFetch = useRef(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyingMessage, setReplyingMessage] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deletingMessage, setDeletingMessage] = useState(false);

  const fetchMessages = useCallback(
    async (targetPage) => {
      try {
        setLoading(true);
        setError("");
        const data = await api.adminContact.getContactMessages({
          page: targetPage,
          limit: PAGE_LIMIT,
          isRead: readFilter,
          replied: repliedFilter,
          searchName,
          searchEmail,
          searchPhone,
          searchSubject,
          searchContent,
        });
        setMessages(data.messages || []);
        setPagination(data.pagination || { page: targetPage, limit: PAGE_LIMIT, total: 0, totalPages: 1 });
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        setError(err.message || "Không thể tải danh sách liên hệ.");
      } finally {
        setLoading(false);
      }
    },
    [
      readFilter,
      repliedFilter,
      searchName,
      searchEmail,
      searchPhone,
      searchSubject,
      searchContent,
    ]
  );

  useEffect(() => {
    const targetPage = resetPageOnNextFetch.current ? 1 : page;
    resetPageOnNextFetch.current = false;

    const timer = setTimeout(() => {
      fetchMessages(targetPage);
    }, 300);
    return () => clearTimeout(timer);
  }, [
    fetchMessages,
    page,
    readFilter,
    repliedFilter,
    searchName,
    searchEmail,
    searchPhone,
    searchSubject,
    searchContent,
  ]);

  const requestPageReset = () => {
    resetPageOnNextFetch.current = true;
    setPage(1);
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

  const handleDeleteClick = (message) => {
    setMessageToDelete(message);
  };

  const handleCancelDelete = () => {
    if (deletingMessage) return;
    setMessageToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!messageToDelete || deletingMessage) return;

    try {
      setDeletingMessage(true);
      await api.adminContact.deleteMessage(messageToDelete._id);
      const nextPage = messages.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await fetchMessages(nextPage);
      }
      setMessageToDelete(null);
      toast.success("Đã xóa tin nhắn liên hệ.");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Không thể xóa tin nhắn liên hệ."));
    } finally {
      setDeletingMessage(false);
    }
  };

  const handlePageChange = async (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === page) return;
    setPage(nextPage);
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
        <Paper className="search-bar" sx={{ background: "var(--admin-sidebar)" }}>
          <div className="admin-search-toolbar">
            <div className="admin-search-toolbar__top">
              <span className="admin-search-toolbar__title">Tìm kiếm liên hệ</span>
              <div className="admin-search-toolbar__actions admin-search-toolbar__stats">
                <span className="unread-pill">Chưa đọc: {unreadCount}</span>
              </div>
            </div>

            <div className="admin-search-toolbar__grid admin-search-toolbar__grid--contact">
              <TextField
                label="Tên người gửi"
                value={searchName}
                onChange={(e) => {
                  setSearchName(e.target.value);
                  requestPageReset();
                }}
                size="small"
                fullWidth
                {...textFieldSx}
              />
              <TextField
                label="Email"
                value={searchEmail}
                onChange={(e) => {
                  setSearchEmail(e.target.value);
                  requestPageReset();
                }}
                size="small"
                fullWidth
                {...textFieldSx}
              />
              <TextField
                label="Số điện thoại"
                value={searchPhone}
                onChange={(e) => {
                  setSearchPhone(e.target.value);
                  requestPageReset();
                }}
                size="small"
                fullWidth
                {...textFieldSx}
              />
            </div>

            <div className="admin-search-toolbar__grid admin-search-toolbar__grid--contact-extra">
              <TextField
                label="Tiêu đề"
                value={searchSubject}
                onChange={(e) => {
                  setSearchSubject(e.target.value);
                  requestPageReset();
                }}
                size="small"
                fullWidth
                {...textFieldSx}
              />
              <TextField
                label="Nội dung tin nhắn"
                value={searchContent}
                onChange={(e) => {
                  setSearchContent(e.target.value);
                  requestPageReset();
                }}
                size="small"
                fullWidth
                {...textFieldSx}
              />
            </div>

            <div className="admin-search-toolbar__filters">
              <div className="admin-search-toolbar__filter-group">
                <span className="view-mode-label">Trạng thái đọc</span>
                <ContactFilterSelector
                  options={READ_FILTER_OPTIONS}
                  value={readFilter}
                  onChange={(value) => {
                    setReadFilter(value);
                    requestPageReset();
                  }}
                  ariaLabel="Lọc theo trạng thái đọc"
                />
              </div>
              <div className="admin-search-toolbar__filter-group">
                <span className="view-mode-label">Phản hồi</span>
                <ContactFilterSelector
                  options={REPLIED_FILTER_OPTIONS}
                  value={repliedFilter}
                  onChange={(value) => {
                    setRepliedFilter(value);
                    requestPageReset();
                  }}
                  ariaLabel="Lọc theo trạng thái phản hồi"
                />
              </div>
            </div>
          </div>
        </Paper>

        {error && <div className="error-message">{error}</div>}

        <ContactMessagesTable
          loading={loading}
          messages={messages}
          expandedSections={expandedSections}
          onToggleExpanded={toggleExpandedSection}
          onMarkAsRead={handleMarkAsRead}
          onOpenReplyModal={openReplyModal}
          onDelete={handleDeleteClick}
        />

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages || 1}
          total={pagination.total}
          pageSize={PAGE_LIMIT}
          onPageChange={handlePageChange}
          variant="admin"
          className="contact-pagination admin-pagination"
        />

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

        <ConfirmDeleteDialog
          isOpen={!!messageToDelete}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          confirming={deletingMessage}
          title="Xóa tin nhắn liên hệ"
          message={
            messageToDelete ? (
              <>
                Bạn có chắc muốn xóa tin nhắn từ <strong>{messageToDelete.name}</strong> (
                {messageToDelete.email})?
              </>
            ) : null
          }
          warning="Dùng chức năng này để xóa tin spam hoặc liên hệ không hợp lệ. Hành động không thể hoàn tác."
        />
      </div>
    </AdminLayout>
  );
};

export default AdminContactMessageListPage;
