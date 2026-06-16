export function getBookingHotelId(booking) {
  if (!booking) return '';
  const hotel = booking.hotel;
  if (!hotel) {
    return booking.hotelId ? String(booking.hotelId) : '';
  }
  if (typeof hotel === 'string' || typeof hotel === 'number') {
    return String(hotel);
  }
  return String(hotel._id || hotel.id || '');
}

export function getBookingHotelName(booking) {
  return (booking.hotel?.name || booking.hotelName || '').toLowerCase();
}

export const VIEW_MODES = {
  LIST: 'list',
  HOTEL: 'hotel',
};

export function groupBookingsByHotel(bookings, hotels = []) {
  const hotelMap = new Map(hotels.map((hotel) => [String(hotel._id), hotel]));
  const groups = new Map();

  for (const booking of bookings) {
    const hotelId = getBookingHotelId(booking);
    const key = hotelId || '__unknown__';
    if (!groups.has(key)) {
      const hotel = hotelMap.get(hotelId);
      groups.set(key, {
        hotelId,
        hotelName: booking.hotel?.name || booking.hotelName || hotel?.name || 'Khách sạn không xác định',
        hotelAddress: hotel?.address || booking.hotel?.address || null,
        bookings: [],
      });
    }
    groups.get(key).bookings.push(booking);
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.hotelName.localeCompare(b.hotelName, 'vi')
  );
}

/**
 * Lọc danh sách đặt phòng cho trang admin (client-side).
 */
export function filterAdminBookings(
  bookings,
  { searchTerm, searchEmail, searchPhone, searchCode, searchHotelName, startDate, endDate }
) {
  return bookings.filter((booking) => {
    const guestName = (booking.guest?.name || booking.userName || '').toLowerCase();
    const guestEmail = (booking.guest?.email || booking.userEmail || '').toLowerCase();
    const guestPhone = booking.guest?.phone || '';
    const code = (booking._id || '').toLowerCase();
    const hotelName = getBookingHotelName(booking);

    if (!guestName.includes((searchTerm || '').toLowerCase())) return false;
    if (!guestEmail.includes((searchEmail || '').toLowerCase())) return false;
    if (!guestPhone.includes(searchPhone || '')) return false;
    if (!code.includes((searchCode || '').toLowerCase())) return false;
    if (searchHotelName && !hotelName.includes((searchHotelName || '').toLowerCase())) return false;

    const checkIn = new Date(booking.checkInDate || booking.checkIn);
    const checkOut = new Date(booking.checkOutDate || booking.checkOut);
    if (startDate && checkIn < new Date(startDate)) return false;
    if (endDate && checkOut > new Date(endDate)) return false;

    return true;
  });
}
