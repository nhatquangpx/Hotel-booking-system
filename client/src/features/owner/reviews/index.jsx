import React, { useState, useEffect, useRef } from 'react';
import { FaStar } from 'react-icons/fa';
import OwnerLayout from '@/features/owner/components/OwnerLayout';
import OwnerGuideCollapsible from '@/features/owner/components/OwnerGuideCollapsible';
import Pagination from '@/shared/components/Pagination/Pagination';
import { PAGE_SIZE } from '@/constants/pagination';
import { useOwnerHotel } from '@/features/owner/context/OwnerHotelContext';
import ReplyModal from './ReplyModal';
import ReviewStatsBreakdown from '@/shared/components/ReviewStatsBreakdown/ReviewStatsBreakdown';
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reviewStats, setReviewStats] = useState(null);
  const [ratingFilter, setRatingFilter] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const prevHotelIdRef = useRef(selectedHotelId);
  const limit = PAGE_SIZE.OWNER_REVIEWS;

  useEffect(() => {
    if (hotelsLoading) return;

    let cancelled = false;
    let pageToFetch = page;
    let ratingToFetch = ratingFilter;

    if (prevHotelIdRef.current !== selectedHotelId) {
      prevHotelIdRef.current = selectedHotelId;
      pageToFetch = 1;
      ratingToFetch = null;
      setReviews([]);
      setReviewStats(null);
      setInitialLoading(true);
      if (page !== 1) setPage(1);
      if (ratingFilter !== null) setRatingFilter(null);
    }

    const requestedHotelId = selectedHotelId;

    const loadReviews = async () => {
      setListLoading(true);
      try {
        const data = await api.ownerReview.getOwnerReviews(
          pageToFetch,
          limit,
          requestedHotelId || undefined,
          ratingToFetch
        );
        if (cancelled || requestedHotelId !== prevHotelIdRef.current) return;
        setReviews(data.reviews || []);
        setReviewStats(data.stats || null);
        setTotalPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || data.reviews?.length || 0);
        setError(null);
      } catch (err) {
        if (cancelled || requestedHotelId !== prevHotelIdRef.current) return;
        setError(err.message || 'Có lỗi xảy ra khi tải danh sách đánh giá');
        setReviews([]);
        setReviewStats(null);
        setTotalPages(1);
        setTotal(0);
      } finally {
        if (!cancelled && requestedHotelId === prevHotelIdRef.current) {
          setListLoading(false);
          setInitialLoading(false);
        }
      }
    };

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [selectedHotelId, hotelsLoading, page, ratingFilter, limit, refreshKey]);

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
    const colors = [
      '#2ecc71',
      '#3498db',
      '#9b59b6',
      '#e74c3c',
      '#f39c12',
      '#1abc9c',
      '#A0826D',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const renderStars = (rating) => {
    const roundedRating = Math.round(rating);
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={i < roundedRating ? 'star star-filled' : 'star star-empty'}
        />
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
    setRefreshKey((key) => key + 1);
  };

  const handleRatingFilterChange = (rating) => {
    setRatingFilter(rating);
    setPage(1);
  };

  if (initialLoading) {
    return (
      <OwnerLayout>
        <div className="owner-reviews-page">
          <div className="loading">Đang tải...</div>
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

        {error && <div className="error-message">{error}</div>}

        <div className="reviews-section">
          <ReviewStatsBreakdown
            stats={reviewStats}
            selectedRating={ratingFilter}
            onRatingSelect={handleRatingFilterChange}
          />

          {listLoading && (
            <div className="reviews-list-loading">Đang tải đánh giá...</div>
          )}

          {!listLoading && reviews.length === 0 ? (
            <div className="empty-reviews">
              <p>
                {ratingFilter
                  ? `Không có đánh giá ${ratingFilter} sao`
                  : 'Chưa có đánh giá nào'}
              </p>
            </div>
          ) : (
            reviews.length > 0 && (
            <div className={`reviews-list${listLoading ? ' reviews-list--loading' : ''}`}>
              {reviews.map((review) => {
                const initials = getInitials(review.guest?.name);
                const avatarColor = getAvatarColor(review.guest?.name);
                const roomNumber = review.booking?.room?.roomNumber || 'N/A';
                const reply = getHotelReply(review);

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
                      {reply && (
                        <div className="review-response">
                          <div className="review-response__label">
                            Phản hồi {formatReplyResponderLabel(reply)}:
                          </div>
                          <div className="review-response__content">
                            {truncateText(reply.text, 150)}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="review-actions">
                      <button
                        type="button"
                        className="reply-button"
                        onClick={() => handleReply(review._id)}
                      >
                        {reply ? 'Chỉnh sửa phản hồi' : 'Phản hồi'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={limit}
          onPageChange={setPage}
          variant="center"
          className="reviews-pagination"
        />

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
