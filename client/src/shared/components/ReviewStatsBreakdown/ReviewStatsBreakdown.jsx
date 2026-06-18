import { FaStar } from 'react-icons/fa';
import './ReviewStatsBreakdown.scss';

/**
 * Thống kê đánh giá theo sao — click vào từng mức sao để lọc danh sách review.
 */
const ReviewStatsBreakdown = ({
  stats,
  selectedRating = null,
  onRatingSelect,
  className = '',
}) => {
  if (!stats || stats.totalRatings <= 0) {
    return null;
  }

  const handleRatingClick = (rating) => {
    if (!onRatingSelect) return;
    onRatingSelect(selectedRating === rating ? null : rating);
  };

  return (
    <div className={`review-stats-breakdown ${className}`.trim()}>
      <div className="review-stats-breakdown__average">
        <div className="review-stats-breakdown__value">
          <span className="review-stats-breakdown__number">
            {stats.averageRating.toFixed(1)}
          </span>
          <div className="review-stats-breakdown__stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`star ${star <= Math.round(stats.averageRating) ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
        <p className="review-stats-breakdown__total">{stats.totalRatings} đánh giá</p>
      </div>

      {stats.ratingCounts && (
        <div className="review-stats-breakdown__bars">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingCounts[rating] || 0;
            const percentage =
              stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
            const isActive = selectedRating === rating;
            const isDisabled = count === 0;

            return (
              <button
                key={rating}
                type="button"
                className={[
                  'review-stats-breakdown__bar-item',
                  isActive ? 'is-active' : '',
                  isDisabled ? 'is-disabled' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => !isDisabled && handleRatingClick(rating)}
                disabled={isDisabled}
                aria-pressed={isActive}
                aria-label={`Lọc đánh giá ${rating} sao (${count})`}
              >
                <span className="review-stats-breakdown__label">{rating} sao</span>
                <div className="review-stats-breakdown__bar">
                  <div
                    className="review-stats-breakdown__bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="review-stats-breakdown__count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {selectedRating && onRatingSelect && (
        <button
          type="button"
          className="review-stats-breakdown__clear"
          onClick={() => onRatingSelect(null)}
        >
          Xóa bộ lọc ({selectedRating} sao)
        </button>
      )}
    </div>
  );
};

export default ReviewStatsBreakdown;
