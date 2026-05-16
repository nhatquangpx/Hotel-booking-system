import React from 'react';
import StaffLayout from '../components/StaffLayout';
import StaffPagePlaceholder from '../components/StaffPagePlaceholder';

const StaffEquipmentPage = () => (
  <StaffLayout>
    <StaffPagePlaceholder
      title="Thiết bị"
      description="Quản lý thiết bị phòng, báo sửa chữa và theo dõi tiến độ xử lý."
    />
  </StaffLayout>
);

export default StaffEquipmentPage;
