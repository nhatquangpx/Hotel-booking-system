import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPhone, FaCalendarAlt } from 'react-icons/fa';
import OwnerLayout from '@/features/owner/components/OwnerLayout';
import api from '@/apis';
import { formatDate } from '@/shared/utils';
import './BookingList.scss';

/**
 * Owner Booking List Page
 * Quản lý đặt phòng cho chủ khách sạn
 */
const OwnerBookingListPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await api.ownerBooking.getOwnerBookings();
      // Lọc chỉ các booking sắp tới (check-in date >= hôm nay)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcomingBookings = data.filter(booking => {
        const checkInDate = new Date(booking.checkInDate);
        checkInDate.setHours(0, 0, 0, 0);
        return checkInDate >= today;
      });
      // Sắp xếp theo check-in date tăng dần
      upcomingBookings.sort((a, b) => {
        return new Date(a.checkInDate) - new Date(b.checkInDate);
      });
      setBookings(upcomingBookings);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      await api.ownerBooking.updateBookingStatus(bookingId, 'paid');
      setBookings(bookings.map(b => 
        b._id === bookingId ? { ...b, paymentStatus: 'paid' } : b
      ));
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi xác nhận đặt phòng');
    }
  };

  // TODO: Xử lý logic check-in/check-out trong tương lai
  // - Cần tạo API endpoint riêng cho check-in/check-out
  // - Cần lưu trạng thái check-in vào database (có thể thêm trường checkedInAt, checkedOutAt vào Booking model)
  // - Cần cập nhật trạng thái phòng khi check-in/check-out
  // - Cần validate: chỉ cho phép check-in trong ngày check-in, chỉ cho phép check-out sau khi đã check-in
  const handleCheckIn = async (bookingId) => {
    try {
      // TODO: Gọi API check-in khi đã implement backend
      // await api.ownerBooking.checkIn(bookingId);
      
      // Tạm thời chỉ cập nhật local state để hiển thị
      setBookings(bookings.map(b => 
        b._id === bookingId ? { ...b, checkedIn: true } : b
      ));
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi check-in');
    }
  };

  const getBookingSource = (booking) => {
    // Nếu không có trường source trong dữ liệu, có thể dựa vào paymentMethod hoặc bỏ qua
    // Tạm thời trả về null nếu không có
    return booking.source || null;
  };

  const getStatusButtons = (booking) => {
    const { paymentStatus, _id } = booking;
    // TODO: Lấy trạng thái check-in từ database thay vì local state
    // const isCheckedIn = booking.checkedInAt !== null;
    const isCheckedIn = booking.checkedIn || false;

    // Nếu đã check-in
    if (isCheckedIn) {
      return (
        <button className="status-btn checked-in">
          Đã nhận phòng
        </button>
        // TODO: Thêm nút Check-out khi đã implement logic check-out
      );
    }

    // Nếu đã thanh toán nhưng chưa check-in
    if (paymentStatus === 'paid') {
      return (
        <>
          <button className="status-btn confirmed">
            Đã xác nhận
          </button>
          <button 
            className="status-btn check-in"
            onClick={() => handleCheckIn(_id)}
          >
            Check-in
          </button>
        </>
      );
    }

    // Nếu đang chờ xác nhận
    if (paymentStatus === 'pending') {
      return (
        <>
          <button className="status-btn pending">
            Chờ xác nhận
          </button>
          <button 
            className="status-btn confirm"
            onClick={() => handleConfirmBooking(_id)}
          >
            Xác nhận
          </button>
        </>
      );
    }

    // Nếu đã hủy
    if (paymentStatus === 'cancelled') {
      return (
        <button className="status-btn cancelled" disabled>
          Đã hủy
        </button>
      );
    }

    return null;
  };

  return (
    <OwnerLayout>
      <div className="owner-booking-list">
        <div className="booking-header">
          <button 
            className="new-booking-btn"
            onClick={() => navigate('/booking/new')}
          >
            + Đặt phòng mới
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-message">
            Đang tải danh sách đặt phòng...
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-message">
            Không có đặt phòng sắp tới nào
          </div>
        ) : (
          <div className="booking-cards">
            {bookings.map(booking => {
              const guest = booking.guest || {};
              const room = booking.room || {};
              const source = getBookingSource(booking);

              return (
                <div key={booking._id} className="booking-card">
                  <div className="booking-info">
                    <div className="guest-name">
                      {guest.name || 'N/A'}
                    </div>
                    
                    {guest.phone && (
                      <div className="info-item">
                        <FaPhone className="info-icon" />
                        <span>{guest.phone}</span>
                      </div>
                    )}

                    {booking.checkInDate && (
                      <div className="info-item">
                        <FaCalendarAlt className="info-icon" />
                        <span>Nhận phòng: {formatDate(booking.checkInDate)}</span>
                      </div>
                    )}

                    {booking.checkOutDate && (
                      <div className="info-item">
                        <FaCalendarAlt className="info-icon" />
                        <span>Trả phòng: {formatDate(booking.checkOutDate)}</span>
                      </div>
                    )}

                    {(room.roomNumber || source) && (
                      <div className="booking-tags">
                        {room.roomNumber && (
                          <span className="tag room-tag">
                            {room.roomNumber}
                          </span>
                        )}
                        {source && (
                          <span className="tag source-tag">
                            {source}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="booking-actions">
                    {getStatusButtons(booking)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerBookingListPage;

