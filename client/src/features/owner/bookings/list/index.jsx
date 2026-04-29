import React, { useState, useEffect, useCallback } from 'react';
import OwnerLayout from '@/features/owner/components/OwnerLayout';
import { useOwnerHotel } from '@/features/owner/context/OwnerHotelContext';
import api from '@/apis';
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
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [proofFilter, setProofFilter] = useState('all');
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

  const closeModals = () => {
    setShowConfirmModal(false);
    setShowCheckInModal(false);
    setShowCheckOutModal(false);
    setSelectedBooking(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedBooking) return;

    const isQrProofMissing =
      selectedBooking.paymentMethod === 'qr_code' && !selectedBooking.qrPaymentProofUrl;
    if (isQrProofMissing) {
      setError('Đơn QR chưa có minh chứng chuyển khoản, không thể xác nhận đã thanh toán');
      return;
    }
    
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

  const filteredBookings = bookings.filter((booking) => {
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

  const isQrProofMissingForSelectedBooking = Boolean(
    selectedBooking &&
    selectedBooking.paymentMethod === 'qr_code' &&
    !selectedBooking.qrPaymentProofUrl
  );

  return (
    <OwnerLayout>
      <div className="owner-booking-list">
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
                <p>Xem nhanh tên khách, ngày nhận phòng, ngày trả phòng và phòng đã đặt.</p>
              </div>
            </div>
            <div className="booking-guide-item">
              <span className="booking-guide-item__step">2</span>
              <div>
                <strong>Xác nhận đơn đúng thời điểm</strong>
                <p>Chuyển đơn từ chờ xác nhận sang đã xác nhận để sẵn sàng đón khách.</p>
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
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!loading && (
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
        )}

        {loading ? (
          <div className="loading-message">
            Đang tải danh sách đặt phòng...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-message">
            Không có đặt phòng phù hợp với bộ lọc
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

