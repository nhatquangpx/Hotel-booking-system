import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { formatDate } from '@/shared/utils';

const formatAddress = (address) => {
  if (!address) return '';
  if (typeof address !== 'object') return String(address);
  return [address.number, address.street, address.city].filter(Boolean).join(', ');
};

const BookingTableRows = ({ bookings, onView }) =>
  bookings.map((booking) => (
    <tr key={booking._id}>
      <td>{booking._id.slice(-6).toUpperCase()}</td>
      <td>{booking.guest?.name || booking.userName || 'N/A'}</td>
      <td>{booking.guest?.email || booking.userEmail || 'N/A'}</td>
      <td>{booking.room?.roomNumber || booking.roomName || 'N/A'}</td>
      <td>{formatDate(booking.checkInDate || booking.checkIn)}</td>
      <td>{formatDate(booking.checkOutDate || booking.checkOut)}</td>
      <td>
        {typeof booking.finalAmount === 'number'
          ? `${booking.finalAmount.toLocaleString('vi-VN')} VND`
          : 'N/A'}
      </td>
      <td>
        <span className={`status-badge ${booking.paymentStatus}`}>
          {booking.paymentStatus === 'pending' && 'Chưa thanh toán'}
          {booking.paymentStatus === 'paid' && 'Đã thanh toán'}
          {booking.paymentStatus === 'cancelled' && 'Đã hủy'}
        </span>
      </td>
      <td>
        <Tooltip title="Xem chi tiết (chỉ đọc)">
          <IconButton
            size="small"
            color="primary"
            aria-label="Xem chi tiết"
            onClick={() => onView(booking._id)}
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      </td>
    </tr>
  ));

const BookingListByHotel = ({ hotelGroups, loading, onView }) => {
  if (loading) {
    return (
      <div className="booking-table">
        <table>
          <tbody>
            <tr>
              <td colSpan="9" className="loading">
                Đang tải...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (!hotelGroups.length) {
    return (
      <div className="booking-groups-empty">
        <p>Không tìm thấy đơn đặt phòng nào</p>
      </div>
    );
  }

  return (
    <div className="booking-groups booking-groups--hotel">
      {hotelGroups.map((group) => (
        <section key={group.hotelId || group.hotelName} className="booking-group-section">
          <div className="booking-group-header">
            <div className="booking-group-title">
              <h2>{group.hotelName}</h2>
              {formatAddress(group.hotelAddress) && (
                <p className="booking-group-address">{formatAddress(group.hotelAddress)}</p>
              )}
            </div>
            <span className="booking-group-count">{group.bookings.length} đơn</span>
          </div>
          <div className="booking-table">
            <table>
              <thead>
                <tr>
                  <th>Mã đặt phòng</th>
                  <th>Khách hàng</th>
                  <th>Email</th>
                  <th>Phòng</th>
                  <th>Nhận phòng</th>
                  <th>Trả phòng</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <BookingTableRows bookings={group.bookings} onView={onView} />
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
};

export default BookingListByHotel;
