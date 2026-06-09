import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { GuestLayout } from '@/features/guest/components/layout';
import BookingDetailModal from '../detail/BookingDetailModal';
import BookingListItem from './BookingListItem';
import api from '@/apis';
import { needsQrProofResubmit, isQrPaymentRejectedCancelled } from '@/shared/utils';
import { computeGuestRefundEligibility } from '@/shared/utils/hotelPolicies';
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
  const [refundBankAccountName, setRefundBankAccountName] = useState('');
  const [refundBankAccountNumber, setRefundBankAccountNumber] = useState('');
  const [refundBankName, setRefundBankName] = useState('');
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
    setCancelReason('');
    setRefundBankAccountName('');
    setRefundBankAccountNumber('');
    setRefundBankName('');
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setCancelBookingId(null);
    setCancelReason('');
    setRefundBankAccountName('');
    setRefundBankAccountNumber('');
    setRefundBankName('');
    setShowCancelModal(false);
  };

  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;
    const target = bookings.find((b) => b._id === cancelBookingId);
    if (!target) return;

    try {
      setCancelling(true);
      const ref = computeGuestRefundEligibility(target);
      const payload = { cancellationReason: cancelReason.trim() };
      if (target.paymentStatus === 'paid' && ref.eligible) {
        payload.refundBankAccountName = refundBankAccountName.trim();
        payload.refundBankAccountNumber = refundBankAccountNumber.trim();
        payload.refundBankName = refundBankName.trim();
      }

      const data = await api.userBooking.cancelBooking(cancelBookingId, payload);

      if (data?.booking) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking._id === cancelBookingId ? { ...booking, ...data.booking } : booking
          )
        );
      }

      closeCancelModal();
      setCancelling(false);
    } catch (err) {
      const msg =
        (typeof err === 'string' && err) ||
        err?.message ||
        err?.response?.data?.message ||
        'Không thể hủy đặt phòng';
      setError(msg);
      setCancelling(false);
      console.error(err);
    }
  };

  const renderBookingStatus = (booking) => {
    if (needsQrProofResubmit(booking)) {
      return <span className="status resubmit">Cần tải lại minh chứng</span>;
    }

    if (booking.paymentStatus === 'cancelled') {
      if (isQrPaymentRejectedCancelled(booking)) {
        return <span className="status rejected">Đã hủy</span>;
      }
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

  const canGuestSubmitCancel = (booking) => {
    if (booking.paymentStatus === 'cancelled') return false;
    if (booking.checkedInAt || booking.checkedOutAt) return false;
    return booking.paymentStatus === 'pending' || booking.paymentStatus === 'paid';
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

  const cancelTarget =
    showCancelModal && cancelBookingId ? bookings.find((b) => b._id === cancelBookingId) : null;
  const cancelRefundRef = cancelTarget
    ? computeGuestRefundEligibility(cancelTarget)
    : { eligible: false, minNoticeDays: 0, daysUntilCheckIn: 0 };
  const showRefundBankForm = Boolean(
    cancelTarget?.paymentStatus === 'paid' && cancelRefundRef.eligible
  );
  const cancelConfirmDisabled =
    cancelling ||
    !cancelReason.trim() ||
    (showRefundBankForm &&
      (!refundBankAccountName.trim() ||
        !refundBankAccountNumber.trim() ||
        !refundBankName.trim()));

  return (
    <GuestLayout>
      <div className="my-bookings-container">
        <h1>Danh sách đặt phòng của tôi</h1>
        <div className="cancel-policy-reminder">
          <strong>Lưu ý:</strong> Bạn có thể gửi hủy đơn khi chưa check-in. Với đơn <strong>đã thanh toán</strong>, chỉ
          khi còn đủ số ngày trước ngày nhận phòng theo chính sách khách sạn thì bạn được hoàn tiền — hệ thống sẽ yêu cầu
          nhập thông tin tài khoản ngân hàng để nhận hoàn. Nếu hủy ngoài thời hạn hoàn (áp dụng cho đơn đã thanh toán),
          đơn vẫn hủy nhưng không kèm hoàn tiền theo quy định. Với đơn <strong>chưa thanh toán</strong>, mốc số ngày đó{' '}
          <strong>không</strong> dùng để xét hoàn tiền (không có khoản đã thu). Hotline{' '}
          <a href="tel:0332915004">0332915004</a>.
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
                canCancel={canGuestSubmitCancel(booking)}
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

              {cancelTarget?.paymentStatus === 'paid' && cancelRefundRef.eligible && (
                <p className="cancel-modal__hint cancel-modal__hint--ok">
                  Đơn đã thanh toán và còn ít nhất <strong>{cancelRefundRef.minNoticeDays}</strong> ngày trước ngày
                  nhận phòng — bạn <strong>được hoàn tiền</strong> theo quy định. Vui lòng nhập thông tin tài khoản ngân
                  hàng bên dưới để nhận hoàn tiền.
                </p>
              )}
              {cancelTarget?.paymentStatus === 'paid' && !cancelRefundRef.eligible && (
                <p className="cancel-modal__hint cancel-modal__hint--warn">
                  Đơn đã thanh toán nhưng <strong>không còn đủ</strong> số ngày trước nhận phòng theo chính sách (cần
                  ít nhất <strong>{cancelRefundRef.minNoticeDays}</strong> ngày, hiện còn{' '}
                  <strong>{cancelRefundRef.daysUntilCheckIn}</strong>). Bạn vẫn có thể hủy, nhưng{' '}
                  <strong>không áp dụng hoàn tiền</strong> theo quy định chung của khách sạn.
                </p>
              )}
              {cancelTarget?.paymentStatus === 'pending' && (
                <p className="cancel-modal__hint">
                  Đơn chưa thanh toán — sau khi hủy bạn không cần thanh toán. Không phát sinh hoàn tiền.
                </p>
              )}

              <div className="form-group">
                <label htmlFor="cancelReason">Lý do hủy</label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Vui lòng cho biết lý do hủy đặt phòng"
                  rows="4"
                />
              </div>

              {showRefundBankForm && (
                <div className="cancel-modal__bank-block">
                  <h3>Thông tin nhận hoàn tiền</h3>
                  <div className="form-group">
                    <label htmlFor="refundBankAccountName">Tên chủ tài khoản *</label>
                    <input
                      id="refundBankAccountName"
                      type="text"
                      value={refundBankAccountName}
                      onChange={(e) => setRefundBankAccountName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="refundBankAccountNumber">Số tài khoản *</label>
                    <input
                      id="refundBankAccountNumber"
                      type="text"
                      inputMode="numeric"
                      value={refundBankAccountNumber}
                      onChange={(e) => setRefundBankAccountNumber(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="refundBankName">Tên ngân hàng *</label>
                    <input
                      id="refundBankName"
                      type="text"
                      value={refundBankName}
                      onChange={(e) => setRefundBankName(e.target.value)}
                      placeholder="Ví dụ: Vietcombank, Techcombank…"
                    />
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeCancelModal} disabled={cancelling}>
                  Đóng
                </button>
                <button
                  type="button"
                  className="confirm-btn"
                  onClick={handleCancelBooking}
                  disabled={cancelConfirmDisabled}
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

