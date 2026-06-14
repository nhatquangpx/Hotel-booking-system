import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaSearch, FaHistory, FaCalendarDay } from 'react-icons/fa';
import { toast } from 'react-toastify';
import OwnerLayout from '@/features/owner/components/OwnerLayout';
import OwnerGuideCollapsible from '@/features/owner/components/OwnerGuideCollapsible';
import { useOwnerHotel } from '@/features/owner/context/OwnerHotelContext';
import api from '@/apis';
import { isTodayCheckInOrCheckOut, apiErrorMessage } from '@/shared/utils';
import OwnerBookingCard from './OwnerBookingCard';
import OwnerBookingDetailModal from './OwnerBookingDetailModal';
import OwnerBookingActionModal from './OwnerBookingActionModal';
import './BookingList.scss';

/**
 * Owner Booking List Page
 * Quản lý đặt phòng cho chủ khách sạn
 */
const OwnerBookingListPage = () => {
  const { selectedHotelId, loading: hotelsLoading } = useOwnerHotel();
  const [searchParams, setSearchParams] = useSearchParams();
  const openedBookingFromUrl = useRef(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [refundProofFile, setRefundProofFile] = useState(null);
  const [rejectionType, setRejectionType] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [proofFilter, setProofFilter] = useState('all');
  const [showPastBookings, setShowPastBookings] = useState(false);
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewProofUrl, setPreviewProofUrl] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);

  const fetchBookings = useCallback(async () => {
    if (hotelsLoading) {
      return;
    }
    try {
      setLoading(true);
      const data = await api.ownerBooking.getOwnerBookings(selectedHotelId || undefined);
      const sorted = [...data].sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate));
      setBookings(sorted);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách đặt phòng');
    } finally {
      setLoading(false);
    }
  }, [selectedHotelId, hotelsLoading]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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

  const openRefundModal = (booking) => {
    setSelectedBooking(booking);
    setRefundProofFile(null);
    setShowRefundModal(true);
  };

  const openRejectModal = (booking) => {
    setSelectedBooking(booking);
    setRejectionType('');
    setShowRejectModal(true);
  };

  const closeModals = () => {
    setShowConfirmModal(false);
    setShowCheckInModal(false);
    setShowCheckOutModal(false);
    setShowRefundModal(false);
    setShowRejectModal(false);
    setSelectedBooking(null);
    setRefundProofFile(null);
    setRejectionType('');
  };

  const handleConfirmBooking = async () => {
    if (!selectedBooking) return;

    const isQrProofMissing =
      selectedBooking.paymentMethod === 'qr_code' && !selectedBooking.qrPaymentProofUrl;
    if (isQrProofMissing) {
      toast.warn('Đơn QR chưa có minh chứng chuyển khoản, không thể xác nhận đã thanh toán');
      return;
    }
    
    try {
      setProcessing(true);
      await api.ownerBooking.updateBookingStatus(selectedBooking._id, 'paid');
      setBookings(bookings.map(b => 
        b._id === selectedBooking._id ? { ...b, paymentStatus: 'paid' } : b
      ));
      closeModals();
      toast.success('Đã xác nhận thanh toán đơn đặt phòng');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Có lỗi xảy ra khi xác nhận đặt phòng'));
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
      toast.success('Check-in thành công');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Có lỗi xảy ra khi check-in'));
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
      toast.success('Check-out thành công');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Có lỗi xảy ra khi check-out'));
    } finally {
      setProcessing(false);
    }
  };

  const getBookingSource = (booking) => {
    // Nếu không có trường source trong dữ liệu, có thể dựa vào paymentMethod hoặc bỏ qua
    // Tạm thời trả về null nếu không có
    return booking.source || null;
  };

  const handleConfirmGuestRefund = async () => {
    if (!selectedBooking) return;
    try {
      setProcessing(true);
      setError(null);
      const data = await api.ownerBooking.confirmGuestRefund(selectedBooking._id, refundProofFile);
      const updated = data?.booking;
      setBookings((prev) =>
        prev.map((b) =>
          b._id === selectedBooking._id
            ? { ...b, ...(updated || {}), ownerRefundCompletedAt: updated?.ownerRefundCompletedAt || new Date() }
            : b
        )
      );
      closeModals();
      toast.success('Đã xác nhận hoàn tiền cho khách');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Có lỗi xảy ra khi xác nhận hoàn tiền'));
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectQrPayment = async () => {
    if (!selectedBooking || !rejectionType) return;

    try {
      setProcessing(true);
      setError(null);
      const data = await api.ownerBooking.rejectQrPayment(selectedBooking._id, rejectionType);
      const updated = data?.booking;
      setBookings((prev) =>
        prev.map((b) =>
          b._id === selectedBooking._id
            ? {
                ...b,
                ...(updated || {}),
              }
            : b
        )
      );
      closeModals();
      const isResubmit =
        updated?.ownerQrRejectionType === 'invalid_proof' && updated?.paymentStatus === 'pending';
      toast.success(
        isResubmit
          ? 'Đã yêu cầu khách tải lại minh chứng'
          : 'Đã xử lý minh chứng QR và thông báo cho khách'
      );
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Có lỗi xảy ra khi xử lý minh chứng QR'));
    } finally {
      setProcessing(false);
    }
  };

  const todayBookingsCount = useMemo(
    () => bookings.filter((b) => isTodayCheckInOrCheckOut(b)).length,
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const query = searchQuery.trim().toLowerCase();

    return bookings.filter((booking) => {
      if (showTodayOnly) {
        if (!isTodayCheckInOrCheckOut(booking)) return false;
      } else if (!showPastBookings) {
        const checkInDate = new Date(booking.checkInDate);
        checkInDate.setHours(0, 0, 0, 0);
        if (checkInDate < today) return false;
      }

      if (query) {
        const guestName = (booking.guest?.name || '').toLowerCase();
        const guestPhone = (booking.guest?.phone || '').toLowerCase();
        const bookingId = (booking._id || '').toLowerCase();
        if (
          !guestName.includes(query) &&
          !guestPhone.includes(query) &&
          !bookingId.includes(query)
        ) {
          return false;
        }
      }

      if (statusFilter !== 'all' && booking.paymentStatus !== statusFilter) {
        return false;
      }

      if (methodFilter !== 'all' && booking.paymentMethod !== methodFilter) {
        return false;
      }

      if (proofFilter === 'proof_submitted') {
        return booking.paymentMethod === 'qr_code' && Boolean(booking.qrPaymentReportedAt);
      }

      if (proofFilter === 'proof_missing') {
        return booking.paymentMethod === 'qr_code' && !booking.qrPaymentReportedAt;
      }

      return true;
    });
  }, [bookings, showTodayOnly, showPastBookings, searchQuery, statusFilter, methodFilter, proofFilter]);

  const openDetailModal = async (bookingId) => {
    try {
      setShowDetailModal(true);
      setDetailLoading(true);
      setDetailBooking(null);
      const data = await api.ownerBooking.getBookingById(bookingId);
      setDetailBooking(data);
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết đơn đặt phòng');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailBooking(null);
  };

  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    if (!bookingId || openedBookingFromUrl.current || loading || hotelsLoading) return;

    openedBookingFromUrl.current = true;
    openDetailModal(bookingId);

    const next = new URLSearchParams(searchParams);
    next.delete('bookingId');
    setSearchParams(next, { replace: true });
  }, [loading, hotelsLoading, searchParams, setSearchParams]);

  const isQrProofMissingForSelectedBooking = Boolean(
    selectedBooking &&
    selectedBooking.paymentMethod === 'qr_code' &&
    !selectedBooking.qrPaymentProofUrl
  );

  return (
    <OwnerLayout>
      <div className="owner-booking-list">
        <OwnerGuideCollapsible label="Hướng dẫn xử lý đặt phòng — bấm để xem">
          <div className="booking-guide-card">
            <div className="booking-guide-card__intro">
              <h3>Hướng dẫn xử lý đặt phòng</h3>
              <p>
                Theo dõi các đơn sắp đến để xác nhận đúng lúc và hỗ trợ khách nhận, trả phòng thuận tiện hơn.
              </p>
            </div>
            <div className="booking-guide-grid">
              <div className="booking-guide-item">
                <span className="booking-guide-item__step">1</span>
                <div>
                  <strong>Kiểm tra danh sách khách sắp đến</strong>
                  <p>
                    Dùng nút &quot;Hôm nay check-in/out&quot; để xem đơn nhận hoặc trả phòng trong ngày, hoặc lọc theo
                    tìm kiếm và trạng thái.
                  </p>
                </div>
              </div>
              <div className="booking-guide-item">
                <span className="booking-guide-item__step">2</span>
                <div>
                  <strong>Xác nhận hoặc xử lý minh chứng QR</strong>
                  <p>
                    Minh chứng không hợp lệ (đã có biến động số dư): yêu cầu khách tải lại. Thanh toán chưa thành công
                    (không có biến động số dư): hủy đơn và báo khách đặt lại.
                  </p>
                </div>
              </div>
              <div className="booking-guide-item">
                <span className="booking-guide-item__step">3</span>
                <div>
                  <strong>Thực hiện nhận phòng</strong>
                  <p>Cập nhật ngay khi khách đến để tình trạng phòng và đơn đặt phòng luôn khớp thực tế.</p>
                </div>
              </div>
              <div className="booking-guide-item">
                <span className="booking-guide-item__step">4</span>
                <div>
                  <strong>Hoàn tất trả phòng</strong>
                  <p>Hoàn tất trả phòng khi khách rời đi để kết thúc lượt lưu trú gọn gàng, chính xác.</p>
                </div>
              </div>
            </div>
          </div>
        </OwnerGuideCollapsible>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!loading && (
          <>
          <div className="booking-search-bar">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Tìm theo tên khách, SĐT hoặc mã đơn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              className={`booking-quick-filter today-check-toggle ${showTodayOnly ? 'active' : ''}`}
              onClick={() => setShowTodayOnly((prev) => !prev)}
              aria-pressed={showTodayOnly}
            >
              <FaCalendarDay />
              <span>
                {showTodayOnly ? 'Bỏ lọc hôm nay' : 'Hôm nay check-in/out'}
                {!showTodayOnly && todayBookingsCount > 0 ? ` (${todayBookingsCount})` : ''}
              </span>
            </button>
            <button
              type="button"
              className={`booking-quick-filter past-bookings-toggle ${showPastBookings ? 'active' : ''}`}
              onClick={() => setShowPastBookings((prev) => !prev)}
              disabled={showTodayOnly}
              title={showTodayOnly ? 'Tắt lọc hôm nay để dùng hiện/ẩn đơn quá khứ' : undefined}
            >
              <FaHistory />
              <span>{showPastBookings ? 'Ẩn đơn quá khứ' : 'Hiện đơn quá khứ'}</span>
            </button>
          </div>

          <div className="booking-filters">
            <div className="filter-group">
              <label htmlFor="statusFilter">Trạng thái</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="paid">Đã xác nhận</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="methodFilter">Phương thức</label>
              <select
                id="methodFilter"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="qr_code">QR chuyển khoản</option>
                <option value="vnpay">VNPay</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="proofFilter">Minh chứng QR</label>
              <select
                id="proofFilter"
                value={proofFilter}
                onChange={(e) => setProofFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="proof_submitted">Đã gửi minh chứng</option>
                <option value="proof_missing">Chưa gửi minh chứng</option>
              </select>
            </div>
          </div>
          </>
        )}

        {loading ? (
          <div className="loading-message">
            Đang tải danh sách đặt phòng...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-message">
            {showTodayOnly
              ? 'Không có đơn check-in hoặc check-out hôm nay'
              : 'Không có đặt phòng phù hợp với bộ lọc'}
          </div>
        ) : (
          <div className="booking-cards">
            {filteredBookings.map(booking => {
              const source = getBookingSource(booking);

              return (
                <OwnerBookingCard
                  key={booking._id}
                  booking={booking}
                  source={source}
                  onOpenDetail={openDetailModal}
                  onOpenConfirm={openConfirmModal}
                  onOpenCheckIn={openCheckInModal}
                  onOpenCheckOut={openCheckOutModal}
                  onOpenRefund={openRefundModal}
                  onOpenReject={openRejectModal}
                  onPreviewProof={setPreviewProofUrl}
                />
              );
            })}
          </div>
        )}

        <OwnerBookingActionModal
          show={showConfirmModal}
          title="Xác nhận đặt phòng"
          prompt="Bạn có chắc chắn muốn xác nhận đặt phòng của"
          booking={selectedBooking}
          processing={processing}
          confirmText="Xác nhận"
          onConfirm={handleConfirmBooking}
          onClose={closeModals}
          onPreviewProof={setPreviewProofUrl}
          showQrProofDetails
          qrProofMissing={isQrProofMissingForSelectedBooking}
          disableConfirm={isQrProofMissingForSelectedBooking}
          disableReason={
            isQrProofMissingForSelectedBooking
              ? 'Chưa có minh chứng chuyển khoản, chưa thể xác nhận'
              : ''
          }
        />

        <OwnerBookingActionModal
          show={showCheckInModal}
          title="Xác nhận check-in"
          prompt="Bạn có chắc chắn muốn thực hiện check-in cho khách hàng"
          booking={selectedBooking}
          processing={processing}
          confirmText="Xác nhận check-in"
          onConfirm={handleCheckIn}
          onClose={closeModals}
          onPreviewProof={setPreviewProofUrl}
        />

        <OwnerBookingActionModal
          show={showCheckOutModal}
          title="Xác nhận check-out"
          prompt="Bạn có chắc chắn muốn thực hiện check-out cho khách hàng"
          booking={selectedBooking}
          processing={processing}
          confirmText="Xác nhận check-out"
          onConfirm={handleCheckOut}
          onClose={closeModals}
          onPreviewProof={setPreviewProofUrl}
          showCheckedInAt
        />

        <OwnerBookingActionModal
          show={showRefundModal}
          title="Xác nhận hoàn tiền cho khách"
          prompt="Khách đã hủy đơn (đủ điều kiện hoàn). Sau khi đã chuyển khoản hoàn / hoàn VNPay, xác nhận cho"
          booking={selectedBooking}
          processing={processing}
          confirmText="Đã hoàn tiền cho khách"
          onConfirm={handleConfirmGuestRefund}
          onClose={closeModals}
          onPreviewProof={setPreviewProofUrl}
          showRefundProofUpload
          refundProofFile={refundProofFile}
          onRefundProofChange={setRefundProofFile}
          disableConfirm={!refundProofFile}
          disableReason={!refundProofFile ? 'Vui lòng tải ảnh minh chứng hoàn tiền' : ''}
        />

        <OwnerBookingActionModal
          show={showRejectModal}
          title="Xử lý minh chứng thanh toán QR"
          prompt="Bạn xác nhận xử lý minh chứng của"
          booking={selectedBooking}
          processing={processing}
          confirmText={
            rejectionType === 'payment_not_successful' ? 'Hủy đơn và thông báo khách' : 'Yêu cầu tải lại minh chứng'
          }
          onConfirm={handleRejectQrPayment}
          onClose={closeModals}
          onPreviewProof={setPreviewProofUrl}
          showQrProofDetails
          showRejectionTypeSelect
          rejectionType={rejectionType}
          onRejectionTypeChange={setRejectionType}
          disableConfirm={!rejectionType}
          disableReason={!rejectionType ? 'Vui lòng chọn một trong hai lý do' : ''}
        />
        <OwnerBookingDetailModal
          show={showDetailModal}
          loading={detailLoading}
          booking={detailBooking}
          onClose={closeDetailModal}
          onPreviewProof={setPreviewProofUrl}
        />
        {previewProofUrl && (
          <div className="proof-preview-overlay" onClick={() => setPreviewProofUrl(null)}>
            <div className="proof-preview-modal" onClick={(e) => e.stopPropagation()}>
              <img src={previewProofUrl} alt="Minh chứng chuyển khoản" />
              <button type="button" className="close-proof-btn" onClick={() => setPreviewProofUrl(null)}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerBookingListPage;

