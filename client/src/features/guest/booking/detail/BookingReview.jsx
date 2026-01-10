import { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import api from '@/apis';
import { formatDate } from '@/shared/utils';
import './BookingReview.scss';

/**
 * Booking Review Component
 * Component xử lý đánh giá cho booking (tạo, sửa, xóa)
 */
const BookingReview = ({ booking, existingReview: initialReview, onReviewUpdate }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [existingReview, setExistingReview] = useState(initialReview || null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);

  // Cập nhật state khi initialReview thay đổi (từ parent)
  useEffect(() => {
    if (initialReview) {
      setExistingReview(initialReview);
      setRating(initialReview.rating);
      setComment(initialReview.comment);
    } else {
      setExistingReview(null);
      setRating(0);
      setComment('');
    }
    setIsEditingReview(false);
    setReviewSubmitted(false);
  }, [initialReview]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setReviewError('Vui lòng chọn số sao đánh giá');
      return;
    }

    if (!comment.trim()) {
      setReviewError('Vui lòng nhập nội dung đánh giá');
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError(null);
      setReviewSubmitted(false);
      
      let response;
      if (existingReview && isEditingReview) {
        // Cập nhật review
        response = await api.review.updateReview(existingReview._id, {
          rating,
          comment: comment.trim()
        });
        setIsEditingReview(false);
      } else {
        // Tạo review mới
        response = await api.userBooking.addReview(booking._id, {
          rating,
          comment: comment.trim()
        });
      }
      
      // Callback để parent reload booking
      if (onReviewUpdate) {
        await onReviewUpdate();
      }
      
      // Cập nhật local state từ response
      if (response.review) {
        setExistingReview(response.review);
        setRating(response.review.rating);
        setComment(response.review.comment);
      }
      
      setReviewSubmitted(true);
      setHoveredRating(0);
      
      // Ẩn success message sau 3 giây
      setTimeout(() => {
        setReviewSubmitted(false);
      }, 3000);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = () => {
    setIsEditingReview(true);
    setReviewSubmitted(false);
    setReviewError(null);
  };

  const handleCancelEdit = () => {
    setIsEditingReview(false);
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    } else {
      setRating(0);
      setComment('');
    }
    setHoveredRating(0);
    setReviewError(null);
  };

  const handleDeleteReview = async () => {
    if (!existingReview) return;
    
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      return;
    }

    try {
      setDeletingReview(true);
      setReviewError(null);
      await api.review.deleteReview(existingReview._id);
      
      // Callback để parent reload booking
      if (onReviewUpdate) {
        await onReviewUpdate();
      }
      
      setExistingReview(null);
      setRating(0);
      setComment('');
      setHoveredRating(0);
      setIsEditingReview(false);
      setReviewSubmitted(false);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Không thể xóa đánh giá. Vui lòng thử lại sau.');
      console.error('Error deleting review:', err);
    } finally {
      setDeletingReview(false);
    }
  };

  // Chỉ hiển thị khi đã checkout
  if (!booking.checkedOutAt) {
    return null;
  }

  return (
    <>
      {/* Hiển thị review đã có nếu không ở chế độ edit */}
      {existingReview && !isEditingReview && (
        <div className="review-display-section">
          <h2>Đánh giá của bạn</h2>
          <div className="review-content">
            <div className="review-header">
              <div className="review-rating-display">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`star ${star <= existingReview.rating ? 'active' : ''}`}
                  />
                ))}
                <span className="rating-value">{existingReview.rating} sao</span>
              </div>
              <div className="review-date">
                Đánh giá ngày {formatDate(existingReview.createdAt)}
                {existingReview.updatedAt && existingReview.updatedAt.toString() !== existingReview.createdAt.toString() && (
                  <span className="updated-indicator"> (đã chỉnh sửa)</span>
                )}
              </div>
            </div>
            <div className="review-comment">
              <p>{existingReview.comment}</p>
            </div>
            <div className="review-actions">
              <button 
                className="edit-review-btn"
                onClick={handleEditReview}
              >
                Sửa đánh giá
              </button>
              <button 
                className="delete-review-btn"
                onClick={handleDeleteReview}
                disabled={deletingReview}
              >
                {deletingReview ? 'Đang xóa...' : 'Xóa đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form đánh giá - hiển thị khi chưa có review hoặc đang ở chế độ edit */}
      {(!existingReview || isEditingReview) && (
        <div className="review-form-section">
          <h2>{isEditingReview ? 'Sửa đánh giá' : 'Đánh giá phòng'}</h2>
          <form onSubmit={handleSubmitReview}>
            <div className="form-group">
              <label htmlFor="rating">Đánh giá (sao):</label>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`star ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                  />
                ))}
                <span className="rating-text">
                  {rating > 0 ? `${rating} sao` : 'Chọn số sao'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="comment">Nội dung đánh giá:</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về khách sạn và phòng nghỉ..."
                rows="6"
                required
              />
            </div>

            {reviewError && (
              <div className="error-message-form">{reviewError}</div>
            )}

            <div className="form-actions">
              {isEditingReview && (
                <button 
                  type="button"
                  className="cancel-edit-btn"
                  onClick={handleCancelEdit}
                  disabled={submittingReview}
                >
                  Hủy
                </button>
              )}
              <button 
                type="submit" 
                className="submit-review-btn"
                disabled={submittingReview || rating === 0 || !comment.trim()}
              >
                {submittingReview ? 'Đang gửi...' : (isEditingReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success message khi đã gửi/cập nhật đánh giá */}
      {reviewSubmitted && (
        <div className="review-success-message">
          <p>
            {isEditingReview 
              ? 'Đánh giá của bạn đã được cập nhật thành công!' 
              : 'Cảm ơn bạn đã đánh giá! Đánh giá của bạn đã được gửi thành công.'}
          </p>
        </div>
      )}
    </>
  );
};

export default BookingReview;

