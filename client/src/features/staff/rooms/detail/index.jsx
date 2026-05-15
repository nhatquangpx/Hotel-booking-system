import React from 'react';
import { useParams } from 'react-router-dom';
import StaffLayout from '../../components/StaffLayout';
import StaffPagePlaceholder from '../../components/StaffPagePlaceholder';

const StaffRoomDetailPage = () => {
  const { id } = useParams();

  return (
    <StaffLayout>
      <StaffPagePlaceholder
        title={`Chi tiết phòng ${id || ''}`}
        description="Thông tin phòng, trạng thái và thiết bị trong phòng."
      />
    </StaffLayout>
  );
};

export default StaffRoomDetailPage;
