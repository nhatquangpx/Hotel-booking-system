export const HOTEL_STATUS_LABELS = {
  active: 'Hoạt động',
  inactive: 'Dừng hoạt động',
  maintenance: 'Bảo trì',
};

export function getHotelStatusLabel(status) {
  return HOTEL_STATUS_LABELS[status] || status || 'Không xác định';
}

/** Khách có thể đặt phòng / lưu yêu thích mới. */
export function isGuestBookableHotel(hotel) {
  const status = hotel?.status || 'active';
  return status === 'active';
}

export function getHotelStatusBannerMessage(status) {
  switch (status) {
    case 'inactive':
      return 'Khách sạn đã dừng hoạt động và không nhận đặt phòng mới.';
    case 'maintenance':
      return 'Khách sạn đang bảo trì (tạm thời) và chưa nhận đặt phòng mới.';
    default:
      return '';
  }
}
