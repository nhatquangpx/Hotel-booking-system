import { useMemo } from 'react';
import StaffLayout from '../components/StaffLayout';
import { useStaffHotel } from '../context/StaffHotelContext';
import api from '@/apis';
import EquipmentPage from '@/features/hotel-shared-ui/equipment/EquipmentPage';

const StaffEquipmentPage = () => {
  const { hotelId, loading: hotelLoading, error: hotelError } = useStaffHotel();

  const equipmentApi = useMemo(
    () => ({
      getByHotel: () => api.staffEquipment.getByHotel(),
      postEquipment: (roomId, payload) => api.staffEquipment.postEquipment(roomId, payload),
      patchEquipment: (roomId, equipmentId, payload) =>
        api.staffEquipment.patchEquipment(roomId, equipmentId, payload),
      deleteEquipment: (roomId, equipmentId) =>
        api.staffEquipment.deleteEquipment(roomId, equipmentId),
      postRepairRequest: (_hotelId, payload) => api.staffEquipment.postRepairRequest(payload),
    }),
    []
  );

  const maintenanceApi = useMemo(
    () => ({
      getMaintenanceContact: () => api.staffHotel.getMaintenanceContact(),
    }),
    []
  );

  return (
    <EquipmentPage
      Layout={StaffLayout}
      hotelId={hotelId}
      hotelLoading={hotelLoading}
      hotelError={hotelError}
      equipmentApi={equipmentApi}
      maintenanceApi={maintenanceApi}
      canEditMaintenanceEmail={false}
      emptyHotelMessage={hotelError || 'Tài khoản chưa được gán khách sạn.'}
    />
  );
};

export default StaffEquipmentPage;
