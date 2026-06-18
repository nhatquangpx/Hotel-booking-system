import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaStar, FaTimes } from 'react-icons/fa';
import { formatDate, apiErrorMessage, getHotelReply } from '@/shared/utils';
import './ReplyModal.scss';

/**
 * Modal phản hồi đánh giá (owner / staff).
 * @param {{ replyToReview: (id: string, text: string) => Promise<unknown>, deleteReply: (id: string) => Promise<unknown> }} reviewApi
 */
const ReplyModal = ({ review, isOpen, onClose, onSuccess, reviewApi }) => {
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (review && isOpen) {
      const existing = getHotelReply(review);
      if (existing?.text) {
        setResponse(existing.text);
        setIsEditMode(true);
      } else {
        setResponse('');
        setIsEditMode(false);
      }
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [review, isOpen]);

  const handleClose = () => {
    if (showDeleteConfirm) {
      setShowDeleteConfirm(false);
      return;
    }
    setResponse('');
    setError(null);
    setIsEditMode(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!response.trim()) {
      setError('Nội dung phản hồi không được để trống');
      return;
    }

    if (response.trim().length > 2000) {
      setError('Nội dung phản hồi không được vượt quá 2000 ký tự');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await reviewApi.replyToReview(review._id, response.trim());
      onSuccess?.();
      handleClose();
      toast.success(isEditMode ? 'Cập nhật phản hồi thành công' : 'Gửi phản hồi thành công');
    } catch (err) {
      const msg = apiErrorMessage(err, 'Có lỗi xảy ra khi gửi phản hồi');
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setSaving(true);
      setError(null);
      await reviewApi.deleteReply(review._id);
      setShowDeleteConfirm(false);
      onSuccess?.();
      setResponse('');
      setError(null);
      setIsEditMode(false);
      onClose();
      toast.success('Xóa phản hồi thành công');
    } catch (err) {
      const msg = apiErrorMessage(err, 'Có lỗi xảy ra khi xóa phản hồi');
      setError(msg);
      toast.error(msg);
      setShowDeleteConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  // Render star rating
  const renderStars = (rating) => {
    const roundedRating = Math.round(rating);
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < roundedRating) {
        stars.push(
          <FaStar key={i} className="star star-filled" />
        );
      } else {
        stars.push(
          <FaStar key={i} className="star star-empty" />
        );
      }
    }

    return stars;
  };

  if (!isOpen || !review) return null;

  const roomNumber = review.booking?.room?.roomNumber || 'N/A';

  return (
    <div className="reply-modal-overlay" onClick={handleClose}>
      <div className="reply-modal" onClick={(e) => e.stopPropagation()}>
        <div className="reply-modal__header">
          <h2>Phản hồi đánh giá</h2>
          <button 
            className="reply-modal__close-btn"
            onClick={handleClose}
            title="Đóng"
          >
            <FaTimes />
          </button>
        </div>

        <div className="reply-modal__content">
          {/* Review Detail */}
          <div className="review-detail">
            <div className="review-detail__header">
              <div className="review-detail__info">
                <div className="review-detail__guest">
                  {review.guest?.name || 'Khách hàng'}
                </div>
                <div className="review-detail__rating">
                  {renderStars(review.rating)}
                </div>
              </div>
              <div className="review-detail__date">
                {formatDate(review.createdAt)}
              </div>
            </div>
            <div className="review-detail__room">
              Phòng {roomNumber}
            </div>
            <div className="review-detail__comment">
              {review.comment}
            </div>
          </div>

          {/* Response Form */}
          <form className="reply-form" onSubmit={handleSubmit}>
            {error && (
              <div className="reply-form__error">
                {error}
              </div>
            )}

            <div className="reply-form__group">
              <label htmlFor="response">
                {isEditMode ? 'Chỉnh sửa phản hồi' : 'Phản hồi của bạn'}
              </label>
              <textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Nhập phản hồi của bạn..."
                rows={6}
                maxLength={2000}
                required
              />
              <div className="reply-form__char-count">
                {response.length} / 2000 ký tự
              </div>
            </div>

            <div className="reply-form__actions">
              {isEditMode && (
                <button
                  type="button"
                  className="reply-form__delete-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={saving}
                >
                  Xóa phản hồi
                </button>
              )}
              <div className="reply-form__submit-group">
                <button
                  type="button"
                  className="reply-form__cancel-btn"
                  onClick={handleClose}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="reply-form__submit-btn"
                  disabled={saving}
                >
                  {saving ? 'Đang lưu...' : (isEditMode ? 'Cập nhật' : 'Gửi phản hồi')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="reply-delete-confirm-overlay"
          onClick={() => !saving && setShowDeleteConfirm(false)}
          role="presentation"
        >
          <div
            className="reply-delete-confirm"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-labelledby="reply-delete-confirm-title"
            aria-describedby="reply-delete-confirm-desc"
          >
            <h3 id="reply-delete-confirm-title">Xác nhận xóa phản hồi</h3>
            <p id="reply-delete-confirm-desc">
              Bạn có chắc chắn muốn xóa phản hồi này? Nội dung sẽ không còn hiển thị với khách và
              không thể khôi phục.
            </p>
            <div className="reply-delete-confirm__actions">
              <button
                type="button"
                className="reply-delete-confirm__cancel"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={saving}
              >
                Hủy
              </button>
              <button
                type="button"
                className="reply-delete-confirm__confirm"
                onClick={handleConfirmDelete}
                disabled={saving}
              >
                {saving ? 'Đang xóa...' : 'Xóa phản hồi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReplyModal;


