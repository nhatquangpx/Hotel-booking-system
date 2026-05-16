import React from 'react';
import StaffLayout from '../components/StaffLayout';
import StaffPagePlaceholder from '../components/StaffPagePlaceholder';

const StaffReviewsPage = () => (
  <StaffLayout>
    <StaffPagePlaceholder
      title="Đánh giá"
      description="Đọc và phản hồi đánh giá của khách. Phản hồi sẽ hiển thị dạng « Tên — Nhân viên khách sạn »."
    />
  </StaffLayout>
);

export default StaffReviewsPage;
