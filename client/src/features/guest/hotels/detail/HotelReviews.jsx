import { FaStar } from 'react-icons/fa';
import { formatDate } from '@/shared/utils';
import './HotelReviews.scss';

/**
 * Hotel Reviews Component
 * Hiển thị đánh giá và thống kê đánh giá của khách sạn
 */
const HotelReviews = ({ 
  reviews, 
  reviewStats, 
  loading, 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  return (
    <div className="hotel-reviews">
      <h2>Đánh giá từ khách hàng</h2>
      
      {reviewStats && reviewStats.totalRatings > 0 && (
        <div className="review-stats">
          <div className="average-rating">
            <div className="rating-value">
              <span className="rating-number">{reviewStats.averageRating.toFixed(1)}</span>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`star ${star <= Math.round(reviewStats.averageRating) ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
            <p className="total-reviews">{reviewStats.totalRatings} đánh giá</p>
          </div>
          
          {reviewStats.ratingCounts && (
            <div className="rating-breakdown">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviewStats.ratingCounts[rating] || 0;
                const percentage = reviewStats.totalRatings > 0 
                  ? (count / reviewStats.totalRatings) * 100 
                  : 0;
                return (
                  <div key={rating} className="rating-bar-item">
                    <span className="rating-label">{rating} sao</span>
                    <div className="rating-bar">
                      <div 
                        className="rating-bar-fill" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="rating-count">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="loading-reviews">Đang tải đánh giá...</div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="no-reviews">
          <p>Chưa có đánh giá nào cho khách sạn này.</p>
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-name">
                      {review.guest?.name || 'Khách hàng ẩn danh'}
                    </div>
                    <div className="review-date">
                      {formatDate(review.createdAt)}
                      {review.updatedAt && review.updatedAt.toString() !== review.createdAt.toString() && (
                        <span className="updated-badge"> (đã chỉnh sửa)</span>
                      )}
                    </div>
                  </div>
                  <div className="review-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`star ${star <= review.rating ? 'active' : ''}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="review-comment">
                  <p>{review.comment}</p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="reviews-pagination">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Trước
              </button>
              <span className="page-info">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HotelReviews;

