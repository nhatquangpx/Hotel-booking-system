import React, { useState, useEffect, useCallback } from 'react';
import { FaStar } from 'react-icons/fa';
import OwnerLayout from '@/features/owner/components/OwnerLayout';
import OwnerGuideCollapsible from '@/features/owner/components/OwnerGuideCollapsible';
import { useOwnerHotel } from '@/features/owner/context/OwnerHotelContext';
import ReplyModal from './ReplyModal';
import api from '@/apis';
import { formatDate, getHotelReply, formatReplyResponderLabel } from '@/shared/utils';
import './Reviews.scss';

/**
 * Owner Reviews Page
 * Trang xem đánh giá của khách hàng cho chủ khách sạn
 */
const OwnerReviewsPage = () => {
  const { selectedHotelId, loading: hotelsLoading } = useOwnerHotel();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (hotelsLoading) {
      return;
    }
    try {
      setLoading(true);
      const data = await api.ownerReview.getOwnerReviews(1, 20, selectedHotelId || undefined);
      setReviews(data.reviews || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  }, [selectedHotelId, hotelsLoading]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Tạo initials từ tên
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Tạo màu ngẫu nhiên cho avatar dựa trên tên
  const getAvatarColor = (name) => {
    if (!name) return '#A0826D';
    const colors = [
      '#2ecc71', // Xanh lá
      '#3498db', // Xanh dương
      '#9b59b6', // Tím
      '#e74c3c', // Đỏ
      '#f39c12', // Cam
      '#1abc9c', // Xanh ngọc
      '#A0826D', // Nâu
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
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

  // Truncate text helper
  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const handleReply = (reviewId) => {
    const review = reviews.find(r => r._id === reviewId);
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
    // Refresh reviews list after successful reply
    fetchReviews();
  };

  if (loading) {
    return (
      <OwnerLayout>
        <div className="owner-reviews-page">
          <div className="loading">Đang tải...</div>
        </div>
      </OwnerLayout>
    );
  }

  if (error) {
    return (
      <OwnerLayout>
        <div className="owner-reviews-page">
          <div className="error-message">{error}</div>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="owner-reviews-page">
        <OwnerGuideCollapsible label="Hướng dẫn theo dõi đánh giá — bấm để xem">
          <div className="reviews-guide-card">
            <div className="reviews-guide-card__intro">
              <h3>Hướng dẫn theo dõi đánh giá</h3>
              <p>
                Xem phản hồi của khách để hiểu trải nghiệm thực tế và trả lời kịp thời khi cần.
              </p>
            </div>
            <div className="reviews-guide-grid">
              <div className="reviews-guide-item">
                <span className="reviews-guide-item__step">1</span>
                <div>
                  <strong>Xem nội dung khách đã chia sẻ</strong>
                  <p>Đọc điểm đánh giá, nhận xét và thông tin phòng để hiểu rõ vấn đề hoặc điểm mạnh.</p>
                </div>
              </div>
              <div className="reviews-guide-item">
                <span className="reviews-guide-item__step">2</span>
                <div>
                  <strong>Dùng đánh giá để cải thiện dịch vụ</strong>
                  <p>Tập trung xử lý những phản hồi lặp lại để nâng chất lượng lưu trú lâu dài.</p>
                </div>
              </div>
              <div className="reviews-guide-item">
                <span className="reviews-guide-item__step">3</span>
                <div>
                  <strong>Phản hồi ngắn gọn và lịch sự</strong>
                  <p>Trả lời để cảm ơn khách, giải thích thêm hoặc ghi nhận góp ý cần cải thiện.</p>
                </div>
              </div>
              <div className="reviews-guide-item">
                <span className="reviews-guide-item__step">4</span>
                <div>
                  <strong>Theo dõi lại sau khi phản hồi</strong>
                  <p>Kiểm tra các góp ý quan trọng đã được xử lý chưa để tránh lặp lại trong những lần lưu trú sau.</p>
                </div>
              </div>
            </div>
          </div>
        </OwnerGuideCollapsible>
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

                return (
                  <div key={review._id} className="review-card">
                    <div className="review-header">
                      <div 
                        className="review-avatar"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initials}
                      </div>
                      <div className="review-info">
                        <div className="review-guest-name">
                          {review.guest?.name || 'Khách hàng'}
                        </div>
                        <div className="review-rating">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                    </div>
                    <div className="review-body">
                      <div className="review-content">
                        <div className="review-room">
                          Phòng {roomNumber}
                        </div>
                        <div className="review-comment">
                          {review.comment}
                        </div>
                        <div className="review-date">
                          {formatDate(review.createdAt)}
                        </div>
                      </div>
                      {getHotelReply(review) && (
                        <div className="review-response">
                          <div className="review-response__label">
                            Phản hồi {formatReplyResponderLabel(getHotelReply(review))}:
                          </div>
                          <div className="review-response__content">
                            {truncateText(getHotelReply(review).text, 150)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="review-actions">
                      <button
                        className="reply-button"
                        onClick={() => handleReply(review._id)}
                      >
                        {getHotelReply(review) ? 'Chỉnh sửa phản hồi' : 'Phản hồi'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reply Modal */}
        {selectedReview && (
          <ReplyModal
            review={selectedReview}
            isOpen={isReplyModalOpen}
            onClose={handleCloseReplyModal}
            onSuccess={handleReplySuccess}
            reviewApi={api.ownerReview}
          />
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerReviewsPage;

