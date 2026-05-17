import React, { useState, useEffect } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import { formatDate } from '@/shared/utils';
import { getHotelReply } from '@/shared/utils/reviewReply';
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
    }
  }, [review, isOpen]);

  const handleClose = () => {
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
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi gửi phản hồi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phản hồi này?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await reviewApi.deleteReply(review._id);
      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi xóa phản hồi');
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
                  onClick={handleDelete}
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
    </div>
  );
};

export default ReplyModal;


