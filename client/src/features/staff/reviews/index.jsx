import { useCallback } from 'react';
import StaffLayout from '../components/StaffLayout';
import { useStaffHotel } from '../context/StaffHotelContext';
import { PAGE_SIZE } from '@/constants/pagination';
import api from '@/apis';
import ReviewsPage from '@/features/hotel-shared-ui/reviews/ReviewsPage';

const staffGuideContent = (
  <div className="reviews-guide-card">
    <div className="reviews-guide-card__intro">
      <h3>Hướng dẫn theo dõi đánh giá</h3>
      <p>
        Đọc phản hồi khách và trả lời thay mặt khách sạn. Phản hồi hiển thị kèm vai trò (Nhân viên
        khách sạn).
      </p>
    </div>
  </div>
);

const StaffReviewsPage = () => {
  const { hotelId, loading: hotelLoading, error: hotelError } = useStaffHotel();

  const fetchReviews = useCallback(
    ({ page, limit, rating }) => api.staffReview.getReviews(page, limit, rating),
    []
  );

  return (
    <ReviewsPage
      Layout={StaffLayout}
      hotelId={hotelId}
      hotelLoading={hotelLoading}
      hotelError={hotelError}
      requireHotel
      pageSize={PAGE_SIZE.STAFF_REVIEWS}
      fetchReviews={fetchReviews}
      reviewApi={api.staffReview}
      guideContent={staffGuideContent}
    />
  );
};

export default StaffReviewsPage;
