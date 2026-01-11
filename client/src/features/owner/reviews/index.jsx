import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import OwnerLayout from '@/features/owner/components/OwnerLayout';
import api from '@/apis';
import { formatDate } from '@/shared/utils';
import './Reviews.scss';

/**
 * Owner Reviews Page
 * Trang xem đánh giá của khách hàng cho chủ khách sạn
 */
const OwnerReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await api.ownerReview.getOwnerReviews();
      setReviews(data.reviews || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

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

  // TODO: Implement reply to review functionality
  const handleReply = (reviewId) => {
    // TODO: Mở modal/form để chủ khách sạn phản hồi lại review
    console.log('Phản hồi review:', reviewId);
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
                    <div className="review-actions">
                      <button
                        className="reply-button"
                        onClick={() => handleReply(review._id)}
                      >
                        Phản hồi
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
};

export default OwnerReviewsPage;

