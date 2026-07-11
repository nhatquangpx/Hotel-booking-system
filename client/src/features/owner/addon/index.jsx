import OwnerLayout from '../components/OwnerLayout';
import { useOwnerHotel } from '../context/OwnerHotelContext';
import { ownerAddonAPI } from '@/apis/owner/addon';
import AddonServicesPage from '@/features/hotel-shared-ui/addon/AddonServicesPage';

const OwnerAddonServicesPage = () => {
  const { selectedHotelId } = useOwnerHotel();

  return (
    <AddonServicesPage
      Layout={OwnerLayout}
      hotelId={selectedHotelId}
      addonApi={ownerAddonAPI}
      roleLabel="khách sạn"
      guideLabel="Hướng dẫn dịch vụ đi kèm cho chủ khách sạn — bấm để xem"
    />
  );
};

export default OwnerAddonServicesPage;
