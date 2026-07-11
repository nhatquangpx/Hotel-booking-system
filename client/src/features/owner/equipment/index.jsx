import { useMemo } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { useOwnerHotel } from '../context/OwnerHotelContext';
import api from '@/apis';
import EquipmentPage from '@/features/hotel-shared-ui/equipment/EquipmentPage';

const OwnerEquipmentPage = () => {
  const { selectedHotelId, loading: hotelsLoading } = useOwnerHotel();

  const equipmentApi = useMemo(
    () => ({
      getByHotel: (hotelId) => api.ownerEquipment.getByHotel(hotelId),
      postEquipment: (roomId, payload) => api.ownerEquipment.postEquipment(roomId, payload),
      patchEquipment: (roomId, equipmentId, payload) =>
        api.ownerEquipment.patchEquipment(roomId, equipmentId, payload),
      deleteEquipment: (roomId, equipmentId) =>
        api.ownerEquipment.deleteEquipment(roomId, equipmentId),
      postRepairRequest: (hotelId, payload) =>
        api.ownerEquipment.postRepairRequest(hotelId, payload),
    }),
    []
  );

  const maintenanceApi = useMemo(
    () => ({
      getMaintenanceContact: (hotelId) => api.ownerHotel.getMaintenanceContact(hotelId),
      updateMaintenanceContact: (hotelId, payload) =>
        api.ownerHotel.updateMaintenanceContact(hotelId, payload),
    }),
    []
  );

  return (
    <EquipmentPage
      Layout={OwnerLayout}
      hotelId={selectedHotelId}
      hotelLoading={hotelsLoading}
      equipmentApi={equipmentApi}
      maintenanceApi={maintenanceApi}
      canEditMaintenanceEmail
      emptyHotelMessage="Vui lòng chọn khách sạn ở thanh trên để xem danh sách phòng."
    />
  );
};

export default OwnerEquipmentPage;
