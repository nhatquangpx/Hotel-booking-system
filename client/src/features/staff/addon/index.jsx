import StaffLayout from '../components/StaffLayout';
import { useStaffHotel } from '../context/StaffHotelContext';
import { staffAddonAPI } from '@/apis/staff/addon';
import AddonServicesPage from '@/features/shared/addon/AddonServicesPage';

const StaffAddonServicesPage = () => {
  const { hotelId } = useStaffHotel();

  return (
    <AddonServicesPage
      Layout={StaffLayout}
      hotelId={hotelId}
      addonApi={staffAddonAPI}
      roleLabel="khách sạn được phân công"
      guideLabel="Hướng dẫn dịch vụ đi kèm cho nhân viên — bấm để xem"
    />
  );
};

export default StaffAddonServicesPage;
