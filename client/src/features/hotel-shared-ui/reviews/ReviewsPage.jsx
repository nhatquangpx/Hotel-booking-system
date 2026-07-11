import React, { useState, useEffect, useRef } from 'react';
import { FaStar } from 'react-icons/fa';
import OwnerGuideCollapsible from '@/features/owner/components/OwnerGuideCollapsible';
import Pagination from '@/shared/components/Pagination/Pagination';
import ReplyModal from './ReplyModal';
import ReviewStatsBreakdown from '@/shared/components/ReviewStatsBreakdown/ReviewStatsBreakdown';
import { formatDate, getHotelReply, formatReplyResponderLabel } from '@/shared/utils';
import './Reviews.scss';

/**
 * Trang đánh giá dùng chung owner / staff.
 *
 * @param {React.ComponentType<{ children: React.ReactNode }>} Layout
 * @param {string | null | undefined} hotelId
 * @param {boolean} hotelLoading
 * @param {string | null} [hotelError]
 * @param {number} pageSize
 * @param {(args: { page: number, limit: number, hotelId?: string, rating: number | null }) => Promise<object>} fetchReviews
 * @param {{ replyToReview: Function, deleteReply: Function }} reviewApi — cho ReplyModal
 * @param {React.ReactNode} guideContent
 * @param {string} [guideLabel]
 * @param {boolean} [requireHotel=false] — staff: bắt buộc có hotel; owner: có thể xem mọi KS
 * @param {string} [emptyHotelMessage]
 */
export default function ReviewsPage({
  Layout,
  hotelId,
  hotelLoading = false,
  hotelError = null,
  requireHotel = false,
  pageSize,
  fetchReviews,
  reviewApi,
  guideContent,
  guideLabel = 'Hướng dẫn theo dõi đánh giá — bấm để xem',
  emptyHotelMessage = 'Tài khoản chưa được gán khách sạn.',
}) {
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
  const prevHotelIdRef = useRef(hotelId);

  useEffect(() => {
    if (requireHotel && !hotelLoading && !hotelId) {
      setInitialLoading(false);
      setListLoading(false);
      setReviews([]);
      setReviewStats(null);
      return;
    }
    if (hotelLoading) return;
    if (requireHotel && !hotelId) return;

    let cancelled = false;
    let pageToFetch = page;
    let ratingToFetch = ratingFilter;

    if (prevHotelIdRef.current !== hotelId) {
      prevHotelIdRef.current = hotelId;
      pageToFetch = 1;
      ratingToFetch = null;
      setReviews([]);
      setReviewStats(null);
      setInitialLoading(true);
      if (page !== 1) setPage(1);
      if (ratingFilter !== null) setRatingFilter(null);
    }

    const requestedHotelId = hotelId;

    const loadReviews = async () => {
      setListLoading(true);
      try {
        const data = await fetchReviews({
          page: pageToFetch,
          limit: pageSize,
          hotelId: requestedHotelId || undefined,
          rating: ratingToFetch,
        });
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
  }, [hotelId, hotelLoading, page, ratingFilter, pageSize, refreshKey, fetchReviews, requireHotel]);

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

  const showNoHotel = requireHotel && !hotelLoading && !hotelId;
  const displayError = error || (requireHotel && !hotelLoading && hotelError);
  const canShowList = requireHotel ? Boolean(hotelId) && !displayError : true;

  if (initialLoading && (!requireHotel || hotelId)) {
    return (
      <Layout>
        <div className="owner-reviews-page">
          <div className="loading">Đang tải...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="owner-reviews-page">
        <OwnerGuideCollapsible label={guideLabel}>
          {guideContent}
        </OwnerGuideCollapsible>

        {showNoHotel && (
          <div className="error-message">{hotelError || emptyHotelMessage}</div>
        )}

        {(error || (requireHotel && hotelId && hotelError)) && (
          <div className="error-message">{error || hotelError}</div>
        )}

        {canShowList && (
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
        )}

        {canShowList && reviews.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
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
            reviewApi={reviewApi}
          />
        )}
      </div>
    </Layout>
  );
}
