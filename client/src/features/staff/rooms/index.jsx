import React from 'react';
import StaffLayout from '../components/StaffLayout';
import StaffPagePlaceholder from '../components/StaffPagePlaceholder';

const StaffRoomMapPage = () => (
  <StaffLayout>
    <StaffPagePlaceholder
      title="Sơ đồ phòng"
      description="Xem danh sách phòng và chi tiết từng phòng (chỉ xem, không chỉnh sửa)."
    />
  </StaffLayout>
);

export default StaffRoomMapPage;
