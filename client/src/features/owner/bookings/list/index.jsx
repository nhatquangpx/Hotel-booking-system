import React, { useState, useEffect } from 'react';
import { FaPhone, FaCalendarAlt } from 'react-icons/fa';
import OwnerLayout from '@/features/owner/components/OwnerLayout';
import api from '@/apis';
import { formatDate, formatDateTime } from '@/shared/utils';
import './BookingList.scss';

/**
 * Owner Booking List Page
 * Quản lý đặt phòng cho chủ khách sạn
 */
const OwnerBookingListPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [processing, setProcessing] = useState(false);

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

  const openConfirmModal = (booking) => {
    setSelectedBooking(booking);
    setShowConfirmModal(true);
  };

  const openCheckInModal = (booking) => {
    setSelectedBooking(booking);
    setShowCheckInModal(true);
  };

  const openCheckOutModal = (booking) => {
    setSelectedBooking(booking);
    setShowCheckOutModal(true);
  };

  const closeModals = () => {
    setShowConfirmModal(false);
    setShowCheckInModal(false);
    setShowCheckOutModal(false);
    setSelectedBooking(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      setProcessing(true);
      await api.ownerBooking.updateBookingStatus(selectedBooking._id, 'paid');
      setBookings(bookings.map(b => 
        b._id === selectedBooking._id ? { ...b, paymentStatus: 'paid' } : b
      ));
      closeModals();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi xác nhận đặt phòng');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedBooking) return;
    
    try {
      setProcessing(true);
      const response = await api.ownerBooking.checkIn(selectedBooking._id);
      
      // Cập nhật booking trong danh sách với dữ liệu từ server
      setBookings(bookings.map(b => 
        b._id === selectedBooking._id ? { ...b, checkedInAt: response.booking.checkedInAt } : b
      ));
      closeModals();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi check-in');
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedBooking) return;
    
    try {
      setProcessing(true);
      const response = await api.ownerBooking.checkOut(selectedBooking._id);
      
      // Cập nhật booking trong danh sách với dữ liệu từ server
      setBookings(bookings.map(b => 
        b._id === selectedBooking._id ? { ...b, checkedOutAt: response.booking.checkedOutAt } : b
      ));
      closeModals();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi check-out');
    } finally {
      setProcessing(false);
    }
  };

  const getBookingSource = (booking) => {
    // Nếu không có trường source trong dữ liệu, có thể dựa vào paymentMethod hoặc bỏ qua
    // Tạm thời trả về null nếu không có
    return booking.source || null;
  };

  const getStatusButtons = (booking) => {
    const { paymentStatus, _id } = booking;
    const isCheckedIn = booking.checkedInAt !== null && booking.checkedInAt !== undefined;
    const isCheckedOut = booking.checkedOutAt !== null && booking.checkedOutAt !== undefined;

    // Nếu đã check-out
    if (isCheckedOut) {
      return (
        <button className="status-btn checked-out" disabled>
          Đã trả phòng
        </button>
      );
    }

    // Nếu đã check-in
    if (isCheckedIn) {
      return (
        <>
          <button className="status-btn checked-in">
            Đã nhận phòng
          </button>
          <button 
            className="status-btn check-out"
            onClick={() => openCheckOutModal(booking)}
          >
            Check-out
          </button>
        </>
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
            onClick={() => openCheckInModal(booking)}
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
            onClick={() => openConfirmModal(booking)}
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
                        <span>
                          Nhận phòng: {formatDate(booking.checkInDate)}
                          {booking.checkedInAt && (
                            <span className="actual-time">
                              {' '}(Đã check-in: {formatDateTime(booking.checkedInAt)})
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {booking.checkOutDate && (
                      <div className="info-item">
                        <FaCalendarAlt className="info-icon" />
                        <span>
                          Trả phòng: {formatDate(booking.checkOutDate)}
                          {booking.checkedOutAt && (
                            <span className="actual-time">
                              {' '}(Đã check-out: {formatDateTime(booking.checkedOutAt)})
                            </span>
                          )}
                        </span>
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

        {/* Modal xác nhận booking */}
        {showConfirmModal && selectedBooking && (
          <div className="confirmation-modal-overlay" onClick={closeModals}>
            <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Xác nhận đặt phòng</h3>
              <p>
                Bạn có chắc chắn muốn xác nhận đặt phòng của{' '}
                <strong>{selectedBooking.guest?.name || 'N/A'}</strong>?
              </p>
              <div className="modal-booking-info">
                <div className="info-row">
                  <span className="info-label">Phòng:</span>
                  <span className="info-value"><strong>{selectedBooking.room?.roomNumber || 'N/A'}</strong></span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ngày nhận:</span>
                  <span className="info-value"><strong>{formatDate(selectedBooking.checkInDate)}</strong></span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ngày trả:</span>
                  <span className="info-value"><strong>{formatDate(selectedBooking.checkOutDate)}</strong></span>
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  className="modal-btn confirm-btn"
                  onClick={handleConfirmBooking}
                  disabled={processing}
                >
                  {processing ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
                <button 
                  className="modal-btn cancel-btn"
                  onClick={closeModals}
                  disabled={processing}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal xác nhận check-in */}
        {showCheckInModal && selectedBooking && (
          <div className="confirmation-modal-overlay" onClick={closeModals}>
            <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Xác nhận check-in</h3>
              <p>
                Bạn có chắc chắn muốn thực hiện check-in cho khách hàng{' '}
                <strong>{selectedBooking.guest?.name || 'N/A'}</strong>?
              </p>
              <div className="modal-booking-info">
                <div className="info-row">
                  <span className="info-label">Phòng:</span>
                  <span className="info-value"><strong>{selectedBooking.room?.roomNumber || 'N/A'}</strong></span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ngày nhận:</span>
                  <span className="info-value"><strong>{formatDate(selectedBooking.checkInDate)}</strong></span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ngày trả:</span>
                  <span className="info-value"><strong>{formatDate(selectedBooking.checkOutDate)}</strong></span>
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  className="modal-btn confirm-btn"
                  onClick={handleCheckIn}
                  disabled={processing}
                >
                  {processing ? 'Đang xử lý...' : 'Xác nhận check-in'}
                </button>
                <button 
                  className="modal-btn cancel-btn"
                  onClick={closeModals}
                  disabled={processing}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal xác nhận check-out */}
        {showCheckOutModal && selectedBooking && (
          <div className="confirmation-modal-overlay" onClick={closeModals}>
            <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Xác nhận check-out</h3>
              <p>
                Bạn có chắc chắn muốn thực hiện check-out cho khách hàng{' '}
                <strong>{selectedBooking.guest?.name || 'N/A'}</strong>?
              </p>
              <div className="modal-booking-info">
                <div className="info-row">
                  <span className="info-label">Phòng:</span>
                  <span className="info-value"><strong>{selectedBooking.room?.roomNumber || 'N/A'}</strong></span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ngày nhận:</span>
                  <span className="info-value"><strong>{formatDate(selectedBooking.checkInDate)}</strong></span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ngày trả:</span>
                  <span className="info-value"><strong>{formatDate(selectedBooking.checkOutDate)}</strong></span>
                </div>
                {selectedBooking.checkedInAt && (
                  <div className="info-row">
                    <span className="info-label">Đã check-in:</span>
                    <span className="info-value"><strong>{formatDateTime(selectedBooking.checkedInAt)}</strong></span>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button 
                  className="modal-btn confirm-btn"
                  onClick={handleCheckOut}
                  disabled={processing}
                >
                  {processing ? 'Đang xử lý...' : 'Xác nhận check-out'}
                </button>
                <button 
                  className="modal-btn cancel-btn"
                  onClick={closeModals}
                  disabled={processing}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerBookingListPage;

