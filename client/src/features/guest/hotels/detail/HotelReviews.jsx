import { formatDate, getHotelReply, formatReviewReplyTitle } from '@/shared/utils';
import Pagination from '@/shared/components/Pagination/Pagination';
import ReviewStatsBreakdown from '@/shared/components/ReviewStatsBreakdown/ReviewStatsBreakdown';
import { FaStar } from 'react-icons/fa';
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
  onPageChange,
  selectedRating = null,
  onRatingFilterChange,
}) => {
  const hasFilter = selectedRating != null;

  return (
    <div className="hotel-reviews">
      <h2>Đánh giá từ khách hàng</h2>

      <ReviewStatsBreakdown
        stats={reviewStats}
        selectedRating={selectedRating}
        onRatingSelect={onRatingFilterChange}
      />

      {loading && (
        <div className="loading-reviews">Đang tải đánh giá...</div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="no-reviews">
          <p>
            {hasFilter
              ? `Không có đánh giá ${selectedRating} sao cho khách sạn này.`
              : 'Chưa có đánh giá nào cho khách sạn này.'}
          </p>
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <>
          <div className="reviews-list">
            {reviews.map((review) => {
              const hotelReply = getHotelReply(review);
              return (
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
                {hotelReply && (
                  <div className="owner-response">
                    <div className="owner-response__header">
                      <div className="owner-response__label">
                        {formatReviewReplyTitle(hotelReply)}
                      </div>
                      {review.ownerResponseAt && (
                        <div className="owner-response__date">
                          {formatDate(review.ownerResponseAt)}
                        </div>
                      )}
                    </div>
                    <div className="owner-response__content">
                      <p>{review.ownerResponse}</p>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              variant="guest"
              className="reviews-pagination"
            />
          )}
        </>
      )}
    </div>
  );
};

export default HotelReviews;

