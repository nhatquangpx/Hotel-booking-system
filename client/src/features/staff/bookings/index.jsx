import React from 'react';
import StaffLayout from '../components/StaffLayout';
import StaffPagePlaceholder from '../components/StaffPagePlaceholder';

const StaffBookingsPage = () => (
  <StaffLayout>
    <StaffPagePlaceholder
      title="Check-in / Check-out"
      description="Xử lý check-in và check-out cho khách đã đặt phòng."
    />
  </StaffLayout>
);

export default StaffBookingsPage;
