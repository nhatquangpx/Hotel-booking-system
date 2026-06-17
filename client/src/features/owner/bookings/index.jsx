import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaSearch, FaHistory, FaClipboardCheck, FaList } from 'react-icons/fa';
import { toast } from 'react-toastify';
import OwnerLayout from '@/features/owner/components/OwnerLayout';
import OwnerGuideCollapsible from '@/features/owner/components/OwnerGuideCollapsible';
import { useOwnerHotel } from '@/features/owner/context/OwnerHotelContext';
import api from '@/apis';
import {
  apiErrorMessage,
  getOwnerActionCounts,
  sortOwnerBookingsByCheckIn,
  bookingNeedsOwnerAction,
  matchesBookingSearch,
  matchesPaymentMethodFilter,
  matchesProofFilter,
} from '@/shared/utils';
import OwnerBookingCard from './OwnerBookingCard';
import OwnerBookingDetailModal from './OwnerBookingDetailModal';
import OwnerBookingActionModal from './OwnerBookingActionModal';
import OwnerBookingActionSections from './OwnerBookingActionSections';
import './BookingList.scss';

const OwnerBookingListPage = () => {
  const { selectedHotelId, loading: hotelsLoading } = useOwnerHotel();
  const [searchParams, setSearchParams] = useSearchParams();
  const openedBookingFromUrl = useRef(false);
  const didSetDefaultView = useRef(false);
  const filterFromUrl = searchParams.get('filter');
  const [viewMode, setViewMode] = useState(() =>
    filterFromUrl === 'all' ? 'all' : 'action'
  );
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
      setBookings(data);
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

  useEffect(() => {
    didSetDefaultView.current = false;
  }, [selectedHotelId]);

  useEffect(() => {
    if (filterFromUrl === 'action') {
      setViewMode('action');
    } else if (filterFromUrl === 'all') {
      setViewMode('all');
    }
  }, [filterFromUrl]);

  const actionCounts = useMemo(() => getOwnerActionCounts(bookings), [bookings]);

  useEffect(() => {
    if (loading || hotelsLoading || didSetDefaultView.current || filterFromUrl) return;
    didSetDefaultView.current = true;
    setViewMode(actionCounts.total > 0 ? 'action' : 'all');
  }, [loading, hotelsLoading, filterFromUrl, actionCounts.total]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    const next = new URLSearchParams(searchParams);
    if (mode === 'action') {
      next.set('filter', 'action');
    } else {
      next.delete('filter');
    }
    setSearchParams(next, { replace: true });
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

  const getBookingSource = (booking) => booking.source || null;

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

  const filteredBookings = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = bookings.filter((booking) => {
      if (!showPastBookings) {
        const checkInDate = new Date(booking.checkInDate);
        checkInDate.setHours(0, 0, 0, 0);
        if (checkInDate < today) return false;
      }

      if (!matchesBookingSearch(booking, searchQuery)) return false;

      if (statusFilter !== 'all' && booking.paymentStatus !== statusFilter) {
        return false;
      }

      if (!matchesPaymentMethodFilter(booking, methodFilter)) return false;
      if (!matchesProofFilter(booking, proofFilter)) return false;

      return true;
    });

    return sortOwnerBookingsByCheckIn(filtered);
  }, [bookings, showPastBookings, searchQuery, statusFilter, methodFilter, proofFilter]);

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

  const cardHandlers = {
    onOpenDetail: openDetailModal,
    onOpenConfirm: openConfirmModal,
    onOpenCheckIn: openCheckInModal,
    onOpenCheckOut: openCheckOutModal,
    onOpenRefund: openRefundModal,
    onOpenReject: openRejectModal,
    onPreviewProof: setPreviewProofUrl,
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
                Tab <strong>Cần xử lý</strong> gom ba nhóm việc: xác nhận thanh toán, hoàn tiền và check-in/out
                hôm nay — mỗi nhóm có bộ lọc riêng. Tab <strong>Tất cả đơn</strong> dùng để tra cứu toàn bộ đơn.
              </p>
            </div>
            <div className="booking-guide-grid">
              <div className="booking-guide-item">
                <span className="booking-guide-item__step">1</span>
                <div>
                  <strong>Xác nhận thanh toán</strong>
                  <p>Ưu tiên đơn QR đã gửi minh chứng; dùng bộ lọc trong từng mục để thu hẹp danh sách.</p>
                </div>
              </div>
              <div className="booking-guide-item">
                <span className="booking-guide-item__step">2</span>
                <div>
                  <strong>Hoàn tiền & minh chứng QR</strong>
                  <p>
                    Xử lý hoàn tiền sau khi đã chuyển khoản. Minh chứng QR không hợp lệ: yêu cầu tải lại; chưa thành
                    công: hủy đơn.
                  </p>
                </div>
              </div>
              <div className="booking-guide-item">
                <span className="booking-guide-item__step">3</span>
                <div>
                  <strong>Check-in / Check-out hôm nay</strong>
                  <p>Cập nhật ngay khi khách đến hoặc rời đi để trạng thái phòng luôn khớp thực tế.</p>
                </div>
              </div>
            </div>
          </div>
        </OwnerGuideCollapsible>

        {error && <div className="error-message">{error}</div>}

        {!loading && (
          <div className="booking-view-tabs" role="tablist" aria-label="Chế độ xem đơn đặt phòng">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'action'}
              className={`booking-view-tab ${viewMode === 'action' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('action')}
            >
              <FaClipboardCheck aria-hidden />
              <span>Cần xử lý</span>
              {actionCounts.total > 0 && (
                <span className="booking-view-tab__count">{actionCounts.total}</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'all'}
              className={`booking-view-tab ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => handleViewModeChange('all')}
            >
              <FaList aria-hidden />
              <span>Tất cả đơn</span>
            </button>
          </div>
        )}

        {!loading && viewMode === 'all' && (
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
                className={`booking-quick-filter past-bookings-toggle ${showPastBookings ? 'active' : ''}`}
                onClick={() => setShowPastBookings((prev) => !prev)}
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
          <div className="loading-message">Đang tải danh sách đặt phòng...</div>
        ) : viewMode === 'action' ? (
          <OwnerBookingActionSections
            hotelId={selectedHotelId}
            bookings={bookings}
            getBookingSource={getBookingSource}
            cardHandlers={cardHandlers}
          />
        ) : filteredBookings.length === 0 ? (
          <div className="empty-message">Không có đặt phòng phù hợp với bộ lọc</div>
        ) : (
          <div className="booking-cards">
            {filteredBookings.map((booking) => (
              <OwnerBookingCard
                key={booking._id}
                booking={booking}
                source={getBookingSource(booking)}
                showActionBadge={bookingNeedsOwnerAction(booking)}
                onOpenDetail={openDetailModal}
                onOpenConfirm={openConfirmModal}
                onOpenCheckIn={openCheckInModal}
                onOpenCheckOut={openCheckOutModal}
                onOpenRefund={openRefundModal}
                onOpenReject={openRejectModal}
                onPreviewProof={setPreviewProofUrl}
              />
            ))}
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
