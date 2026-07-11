import { useCallback } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { useOwnerHotel } from '../context/OwnerHotelContext';
import { PAGE_SIZE } from '@/constants/pagination';
import api from '@/apis';
import ReviewsPage from '@/features/hotel-shared-ui/reviews/ReviewsPage';

const ownerGuideContent = (
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
);

const OwnerReviewsPage = () => {
  const { selectedHotelId, loading: hotelsLoading } = useOwnerHotel();

  const fetchReviews = useCallback(
    ({ page, limit, hotelId, rating }) =>
      api.ownerReview.getOwnerReviews(page, limit, hotelId || undefined, rating),
    []
  );

  return (
    <ReviewsPage
      Layout={OwnerLayout}
      hotelId={selectedHotelId}
      hotelLoading={hotelsLoading}
      requireHotel={false}
      pageSize={PAGE_SIZE.OWNER_REVIEWS}
      fetchReviews={fetchReviews}
      reviewApi={api.ownerReview}
      guideContent={ownerGuideContent}
    />
  );
};

export default OwnerReviewsPage;
