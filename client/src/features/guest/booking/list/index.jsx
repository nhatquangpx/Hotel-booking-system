import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { GuestLayout } from '@/features/guest/components/layout';
import Pagination from '@/shared/components/Pagination/Pagination';
import { PAGE_SIZE } from '@/constants/pagination';
import BookingDetailModal from '../detail/BookingDetailModal';
import BookingListItem from './BookingListItem';
import api from '@/apis';
import {
  needsQrProofResubmit,
  isQrPaymentRejectedCancelled,
  computeGuestRefundEligibility,
  isPendingHoldExpiredBooking,
} from '@/shared/utils';
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
  const [filterHotels, setFilterHotels] = useState([]);
  const [hotelFilter, setHotelFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE.GUEST_BOOKINGS,
    total: 0,
    totalPages: 1,
  });
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
  const openedBookingFromUrl = useRef(false);

  const fetchBookings = useCallback(
    async (targetPage) => {
      if (!user) return;
      const result = await api.userBooking.getMyBookings({
        page: targetPage,
        limit: PAGE_SIZE.GUEST_BOOKINGS,
        hotelId: hotelFilter || undefined,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
      });
      setBookings(result.items || []);
      setPagination(result.pagination);
      if (result.filterHotels?.length) {
        setFilterHotels(result.filterHotels);
      }
    },
    [user, hotelFilter, dateFrom, dateTo]
  );

  const refreshBookings = useCallback(async () => {
    try {
      await fetchBookings(page);
    } catch (err) {
      console.error('Error refreshing bookings:', err);
    }
  }, [fetchBookings, page]);

  const handleHoldExpired = useCallback(async () => {
    await refreshBookings();
    if (!detailBooking?._id) return;
    try {
      const updated = await api.userBooking.getBookingById(detailBooking._id);
      setDetailBooking(updated);
    } catch (err) {
      console.error('Error refreshing booking detail after hold expiry:', err);
    }
  }, [refreshBookings, detailBooking?._id]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { redirectUrl: '/my-bookings' } });
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchBookings(page);
      } catch (err) {
        setError('Không thể tải danh sách đặt phòng');
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate, page, hotelFilter, dateFrom, dateTo, fetchBookings]);

  const clearFilters = () => {
    setHotelFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(hotelFilter || dateFrom || dateTo);

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

    if (booking.checkedOutAt) {
      return <span className="status checked-out">Đã checkout</span>;
    }

    if (booking.checkedInAt) {
      return <span className="status checked-in">Đã checkin</span>;
    }

    if (booking.paymentStatus === 'paid') {
      return <span className="status paid">Đã thanh toán</span>;
    }

    if (booking.paymentStatus === 'pending') {
      if (isPendingHoldExpiredBooking(booking)) {
        return <span className="status cancelled">Hết hạn giữ phòng</span>;
      }
      if (booking.paymentMethod === 'qr_code' && booking.qrPaymentReportedAt) {
        return <span className="status pending">Chờ xác nhận thanh toán</span>;
      }
      return <span className="status pending">Chờ thanh toán</span>;
    }

    return <span className="status">{booking.paymentStatus}</span>;
  };

  const handleContinuePayment = async (b) => {
    if (isPendingHoldExpiredBooking(b)) {
      setError('Đơn đã quá thời hạn giữ phòng. Vui lòng đặt phòng mới.');
      return;
    }
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
    if (!bookingIdFromQuery || openedBookingFromUrl.current || !user) return;

    openedBookingFromUrl.current = true;
    openDetailModal(bookingIdFromQuery);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('bookingId');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, user]);

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

  const showEmptyState = !loading && !error && pagination.total === 0;

  return (
    <GuestLayout>
      <div className="my-bookings-container">
        <h1>Danh sách đặt phòng của tôi</h1>
        <div className="cancel-policy-reminder">
          <strong>Lưu ý:</strong> Bạn có thể gửi hủy đơn khi chưa check-in. Với đơn <strong>đã thanh toán</strong>, chỉ
          khi còn đủ số ngày trước ngày nhận phòng theo chính sách khách sạn thì bạn được hoàn tiền — dù thanh toán bằng
          QR hay VNPay, khách sạn sẽ chuyển khoản hoàn thủ công; hệ thống sẽ yêu cầu nhập STK nhận hoàn. Nếu hủy ngoài thời hạn hoàn (áp dụng cho đơn đã thanh toán),
          đơn vẫn hủy nhưng không kèm hoàn tiền theo quy định. Với đơn <strong>chưa thanh toán</strong>, mốc số ngày đó{' '}
          <strong>không</strong> dùng để xét hoàn tiền (không có khoản đã thu). Hotline{' '}
          <a href="tel:0332915004">0332915004</a>.
        </div>

        <div className="my-bookings-filters">
          <div className="my-bookings-filters__field">
            <label htmlFor="my-bookings-hotel">Khách sạn</label>
            <select
              id="my-bookings-hotel"
              value={hotelFilter}
              onChange={(e) => {
                setHotelFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả khách sạn</option>
              {filterHotels.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div className="my-bookings-filters__field">
            <label htmlFor="my-bookings-from">Nhận phòng từ</label>
            <input
              id="my-bookings-from"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="my-bookings-filters__field">
            <label htmlFor="my-bookings-to">Đến</label>
            <input
              id="my-bookings-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {hasActiveFilters && (
            <button type="button" className="my-bookings-filters__clear" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          )}
        </div>

        {loading && <div className="loading">Đang tải...</div>}

        {error && <div className="error-message">{error}</div>}

        {showEmptyState && !hasActiveFilters && (
          <div className="no-bookings">
            <p>Bạn chưa có đặt phòng nào</p>
            <button className="browse-hotels-btn" type="button" onClick={() => navigate('/hotels')}>
              Tìm khách sạn ngay
            </button>
          </div>
        )}

        {showEmptyState && hasActiveFilters && (
          <div className="no-bookings no-bookings--filtered">
            <p>Không có đặt phòng phù hợp bộ lọc</p>
            <button type="button" className="browse-hotels-btn browse-hotels-btn--secondary" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <>
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
                  onHoldExpired={refreshBookings}
                />
              ))}
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={pagination.limit}
              onPageChange={setPage}
              variant="guest"
              className="my-bookings-pagination"
            />
          </>
        )}

        {showCancelModal && (
          <div className="cancel-modal-overlay">
            <div className="cancel-modal">
              <h2>Xác nhận hủy đặt phòng</h2>
              <p>Bạn có chắc chắn muốn hủy đặt phòng này?</p>

              {cancelTarget?.paymentStatus === 'paid' && cancelRefundRef.eligible && (
                <p className="cancel-modal__hint cancel-modal__hint--ok">
                  Đơn đã thanh toán và còn ít nhất <strong>{cancelRefundRef.minNoticeDays}</strong> ngày trước ngày
                  nhận phòng — bạn <strong>được hoàn tiền</strong> theo quy định. Khách sạn sẽ chuyển khoản hoàn thủ công
                  (QR hay VNPay) — vui lòng nhập STK nhận hoàn bên dưới.
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
          onHoldExpired={handleHoldExpired}
        />
      </div>
    </GuestLayout>
  );
};

export default GuestMyBookingsPage;
