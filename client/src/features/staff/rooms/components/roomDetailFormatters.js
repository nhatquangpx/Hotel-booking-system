export { formatRoomType } from '@/constants/roomTypes';
import { getRoomPrice } from '@/shared/utils';

export const formatRoomStatus = (status) => {
  const statusMap = {
    active: 'Hoạt động',
    maintenance: 'Bảo trì',
    inactive: 'Tạm ngưng',
  };
  return statusMap[status] || status || '—';
};

export const formatBookingStatus = (status) => {
  const statusMap = {
    empty: 'Trống',
    occupied: 'Đang ở',
    pending: 'Chờ nhận',
  };
  return statusMap[status] || status || 'Trống';
};

export const formatPrice = (price) => {
  if (!price && price !== 0) return '0 VND';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(getRoomPrice(price));
};
