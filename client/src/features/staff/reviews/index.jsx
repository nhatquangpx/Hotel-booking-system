import React, { useState, useEffect, useCallback } from 'react';
import { FaStar } from 'react-icons/fa';
import StaffLayout from '@/features/staff/components/StaffLayout';
import OwnerGuideCollapsible from '@/features/owner/components/OwnerGuideCollapsible';
import Pagination from '@/shared/components/Pagination/Pagination';
import { PAGE_SIZE } from '@/constants/pagination';
import { useStaffHotel } from '@/features/staff/context/StaffHotelContext';
import ReplyModal from '@/features/owner/reviews/ReplyModal';
import api from '@/apis';
import { formatDate, getHotelReply, formatReplyResponderLabel } from '@/shared/utils';
import '@/features/owner/reviews/Reviews.scss';

const StaffReviewsPage = () => {
  const { hotelId, loading: hotelLoading, error: hotelError } = useStaffHotel();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const limit = PAGE_SIZE.STAFF_REVIEWS;

  const fetchReviews = useCallback(async (pageNum = 1) => {
    if (hotelLoading || !hotelId) {
      return;
    }
    try {
      setLoading(true);
      const data = await api.staffReview.getReviews(pageNum, limit);
      setReviews(data.reviews || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || data.reviews?.length || 0);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [hotelId, hotelLoading, limit]);

  useEffect(() => {
    setPage(1);
  }, [hotelId]);

  useEffect(() => {
    fetchReviews(page);
  }, [fetchReviews, page]);

  useEffect(() => {
    if (!hotelLoading && !hotelId) {
      setLoading(false);
      setReviews([]);
    }
  }, [hotelLoading, hotelId]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    if (!name) return '#A0826D';
    const colors = ['#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#1abc9c', '#A0826D'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const renderStars = (rating) => {
    const roundedRating = Math.round(rating);
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FaStar key={i} className={i < roundedRating ? 'star star-filled' : 'star star-empty'} />
      );
    }
    return stars;
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength).trim()}...`;
  };

  const handleReply = (reviewId) => {
    const review = reviews.find((r) => r._id === reviewId);
    if (review) {
      setSelectedReview(review);
      setIsReplyModalOpen(true);
    }
  };

  const handleCloseReplyModal = () => {
    setIsReplyModalOpen(false);
    setSelectedReview(null);
  };

  const handleReplySuccess = () => {
    fetchReviews(page);
  };

  const showNoHotel = !hotelLoading && !hotelId;
  const displayError = error || (!hotelLoading && hotelError);

  if (loading && hotelId) {
    return (
      <StaffLayout>
        <div className="owner-reviews-page">
          <div className="loading">Đang tải...</div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="owner-reviews-page">
        <OwnerGuideCollapsible label="Hướng dẫn theo dõi đánh giá — bấm để xem">
          <div className="reviews-guide-card">
            <div className="reviews-guide-card__intro">
              <h3>Hướng dẫn theo dõi đánh giá</h3>
              <p>Đọc phản hồi khách và trả lời thay mặt khách sạn. Phản hồi hiển thị kèm vai trò (Nhân viên khách sạn).</p>
            </div>
          </div>
        </OwnerGuideCollapsible>

        {showNoHotel && (
          <div className="error-message">{hotelError || 'Tài khoản chưa được gán khách sạn.'}</div>
        )}

        {displayError && hotelId && <div className="error-message">{displayError}</div>}

        {hotelId && !displayError && (
          <div className="reviews-section">
            {reviews.length === 0 ? (
              <div className="empty-reviews">
                <p>Chưa có đánh giá nào</p>
              </div>
            ) : (
              <div className="reviews-list">
                {reviews.map((review) => {
                  const initials = getInitials(review.guest?.name);
                  const avatarColor = getAvatarColor(review.guest?.name);
                  const roomNumber = review.booking?.room?.roomNumber || 'N/A';
                  const reply = getHotelReply(review);

                  return (
                    <div key={review._id} className="review-card">
                      <div className="review-header">
                        <div className="review-avatar" style={{ backgroundColor: avatarColor }}>
                          {initials}
                        </div>
                        <div className="review-info">
                          <div className="review-guest-name">{review.guest?.name || 'Khách hàng'}</div>
                          <div className="review-rating">{renderStars(review.rating)}</div>
                        </div>
                      </div>
                      <div className="review-body">
                        <div className="review-content">
                          <div className="review-room">Phòng {roomNumber}</div>
                          <div className="review-comment">{review.comment}</div>
                          <div className="review-date">{formatDate(review.createdAt)}</div>
                        </div>
                        {reply && (
                          <div className="review-response">
                            <div className="review-response__label">
                              Phản hồi {formatReplyResponderLabel(reply)}:
                            </div>
                            <div className="review-response__content">{truncateText(reply.text, 150)}</div>
                          </div>
                        )}
                      </div>
                      <div className="review-actions">
                        <button type="button" className="reply-button" onClick={() => handleReply(review._id)}>
                          {reply ? 'Chỉnh sửa phản hồi' : 'Phản hồi'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {hotelId && !displayError && reviews.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={limit}
            onPageChange={setPage}
            variant="center"
            className="reviews-pagination"
          />
        )}

        {selectedReview && (
          <ReplyModal
            review={selectedReview}
            isOpen={isReplyModalOpen}
            onClose={handleCloseReplyModal}
            onSuccess={handleReplySuccess}
            reviewApi={api.staffReview}
          />
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffReviewsPage;
