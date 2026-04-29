import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { GuestLayout } from '@/features/guest/components/layout';
import BookingDetailModal from '../detail/BookingDetailModal';
import BookingListItem from './BookingListItem';
import api from '@/apis';
import './MyBookings.scss';

/**
 * Guest My Bookings page feature
 * List of bookings for guest users
 */
const GuestMyBookingsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector(state => state.user.user);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { redirectUrl: '/my-bookings' } });
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await api.userBooking.getMyBookings();
        if (response && Array.isArray(response)) {
          setBookings(response);
        } else {
          setBookings([]);
        }
        setLoading(false);
      } catch (err) {
        setError('Không thể tải danh sách đặt phòng');
        setLoading(false);
        console.error('Error fetching bookings:', err);
      }
    };

    fetchBookings();
  }, [user, navigate]);

  const openCancelModal = (bookingId) => {
    setCancelBookingId(bookingId);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setCancelBookingId(null);
    setCancelReason('');
    setShowCancelModal(false);
  };

  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;

    try {
      setCancelling(true);
      await api.userBooking.cancelBooking(cancelBookingId, cancelReason);
      
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === cancelBookingId 
            ? { ...booking, paymentStatus: 'cancelled' } 
            : booking
        )
      );
      
      closeCancelModal();
      setCancelling(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể hủy đặt phòng');
      setCancelling(false);
      console.error(err);
    }
  };

  const renderBookingStatus = (booking) => {
    // Nếu đã hủy
    if (booking.paymentStatus === 'cancelled') {
      return <span className="status cancelled">Đã hủy</span>;
    }
    
    // Nếu đã checkout (ưu tiên cao nhất)
    if (booking.checkedOutAt) {
      return <span className="status checked-out">Đã checkout</span>;
    }
    
    // Nếu đã checkin nhưng chưa checkout
    if (booking.checkedInAt) {
      return <span className="status checked-in">Đã checkin</span>;
    }
    
    // Nếu đã thanh toán nhưng chưa checkin
    if (booking.paymentStatus === 'paid') {
      return <span className="status paid">Đã thanh toán</span>;
    }
    
    // Chờ thanh toán
    if (booking.paymentStatus === 'pending') {
      if (booking.paymentMethod === 'qr_code' && booking.qrPaymentReportedAt) {
        return <span className="status pending">Chờ xác nhận thanh toán</span>;
      }
      return <span className="status pending">Chờ thanh toán</span>;
    }
    
    return <span className="status">{booking.paymentStatus}</span>;
  };

  const handleContinuePayment = async (b) => {
    if (b.paymentMethod === 'vnpay') {
      try {
        setPayingBookingId(b._id);
        setError(null);
        const res = await api.payment.createVNPayPaymentUrl(b._id);
        window.location.href = res.paymentUrl;
      } catch (err) {
        const msg = typeof err === 'string' ? err : err?.message || 'Không thể tạo link thanh toán';
        setError(msg);
        setPayingBookingId(null);
      }
    } else {
      navigate('/booking/new', { state: { bookingId: b._id } });
    }
  };

  const canCancelBooking = (booking) => {
    // Không cho phép hủy nếu đã hủy, đã thanh toán, đã checkin hoặc đã checkout
    if (
      booking.paymentStatus === 'cancelled' || 
      booking.paymentStatus === 'paid' ||
      booking.checkedInAt ||
      booking.checkedOutAt
    ) {
      return false;
    }
    
    // Kiểm tra còn cách ngày check-in ít nhất 2 ngày
    const checkInDate = new Date(booking.checkInDate);
    const today = new Date();
    const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));
    
    return daysUntilCheckIn >= 2;
  };

  const openDetailModal = async (bookingId) => {
    try {
      setShowDetailModal(true);
      setDetailLoading(true);
      setDetailBooking(null);
      const data = await api.userBooking.getBookingById(bookingId);
      setDetailBooking(data);
    } catch (err) {
      setError('Không thể tải chi tiết đặt phòng');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailBooking(null);
  };

  const handleDetailReviewUpdate = async () => {
    if (!detailBooking?._id) return;
    try {
      const updated = await api.userBooking.getBookingById(detailBooking._id);
      setDetailBooking(updated);
      setBookings((prev) => prev.map((b) => (b._id === updated._id ? { ...b, review: updated.review } : b)));
    } catch (err) {
      console.error('Error refreshing detail booking:', err);
    }
  };

  useEffect(() => {
    const bookingIdFromQuery = searchParams.get('bookingId');
    if (!bookingIdFromQuery || loading || !bookings.length) return;

    const matchedBooking = bookings.find((b) => b._id === bookingIdFromQuery);
    if (!matchedBooking) return;

    openDetailModal(bookingIdFromQuery);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('bookingId');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, loading, bookings]);

  return (
    <GuestLayout>
      <div className="my-bookings-container">
        <h1>Danh sách đặt phòng của tôi</h1>
        <div className="cancel-policy-reminder">
          <strong>Lưu ý:</strong> Bạn chỉ có thể hủy đơn đặt phòng nếu đơn chưa thanh toán và còn cách ngày nhận phòng ít nhất <strong>2 ngày</strong>. Nếu đơn đã thanh toán, vui lòng liên hệ hotline <a href="tel:0332915004">0332915004</a> để được hỗ trợ.
        </div>
        
        {loading && <div className="loading">Đang tải...</div>}
        
        {error && <div className="error-message">{error}</div>}
        
        {!loading && !error && (!bookings || bookings.length === 0) && (
          <div className="no-bookings">
            <p>Bạn chưa có đặt phòng nào</p>
            <button 
              className="browse-hotels-btn"
              onClick={() => navigate('/hotels')}
            >
              Tìm khách sạn ngay
            </button>
          </div>
        )}
        
        {!loading && !error && bookings && bookings.length > 0 && (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <BookingListItem
                key={booking._id}
                booking={booking}
                statusNode={renderBookingStatus(booking)}
                payingBookingId={payingBookingId}
                canCancel={canCancelBooking(booking)}
                onOpenDetail={openDetailModal}
                onContinuePayment={handleContinuePayment}
                onOpenCancel={openCancelModal}
              />
            ))}
          </div>
        )}
        
        {/* Modal hủy đặt phòng */}
        {showCancelModal && (
          <div className="cancel-modal-overlay">
            <div className="cancel-modal">
              <h2>Xác nhận hủy đặt phòng</h2>
              <p>Bạn có chắc chắn muốn hủy đặt phòng này?</p>
              
              <div className="form-group">
                <label htmlFor="cancelReason">Lý do hủy</label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Vui lòng cho biết lý do hủy đặt phòng"
                  rows="4"
                ></textarea>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={closeCancelModal}
                  disabled={cancelling}
                >
                  Đóng
                </button>
                <button 
                  className="confirm-btn"
                  onClick={handleCancelBooking}
                  disabled={cancelling || !cancelReason.trim()}
                >
                  {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        )}
        <BookingDetailModal
          show={showDetailModal}
          loading={detailLoading}
          booking={detailBooking}
          onClose={closeDetailModal}
          onDetailBookingChange={setDetailBooking}
          onListBookingPatch={(bookingId, patch) =>
            setBookings((prev) =>
              prev.map((b) =>
                b._id === bookingId
                  ? {
                      ...b,
                      ...(patch.qrPaymentReportedAt ? { qrPaymentReportedAt: patch.qrPaymentReportedAt } : {}),
                      ...(patch.qrPaymentProofUrl ? { qrPaymentProofUrl: patch.qrPaymentProofUrl } : {}),
                    }
                  : b
              )
            )
          }
          onReviewUpdate={handleDetailReviewUpdate}
          onError={setError}
        />
      </div>
    </GuestLayout>
  );
};

export default GuestMyBookingsPage;

