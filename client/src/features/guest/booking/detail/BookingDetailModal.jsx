import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import BookingReview from './BookingReview';
import api from '@/apis';
import { getImageUrl } from '@/constants/images';
import { formatDate, needsQrProofResubmit, isQrPaymentRejectedCancelled, getRoomPrice } from '@/shared/utils';
import { formatRoomType } from '@/constants/roomTypes';

const BookingDetailModal = ({
  show,
  loading,
  booking,
  onClose,
  onDetailBookingChange,
  onListBookingPatch,
  onReviewUpdate,
  onError,
}) => {
  const navigate = useNavigate();
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [confirmingQrBookingId, setConfirmingQrBookingId] = useState(null);
  const [hotelImageIndex, setHotelImageIndex] = useState(0);
  const [roomImageIndex, setRoomImageIndex] = useState(0);
  const [previewProofUrl, setPreviewProofUrl] = useState(null);
  const [detailProofImage, setDetailProofImage] = useState(null);

  useEffect(() => {
    if (!show) return;
    setHotelImageIndex(0);
    setRoomImageIndex(0);
    setPreviewProofUrl(null);
    setDetailProofImage(null);
  }, [show, booking?._id]);

  if (!show) return null;

  const formatAddressText = (address) => {
    if (!address) return 'N/A';
    if (typeof address === 'string') return address;
    if (typeof address === 'object') {
      const parts = [address.number, address.street, address.ward, address.district, address.city].filter(Boolean);
      return parts.length ? parts.join(', ') : 'N/A';
    }
    return 'N/A';
  };

  const renderBookingStatus = (detailBooking) => {
    if (needsQrProofResubmit(detailBooking)) {
      return <span className="status resubmit">Cần tải lại minh chứng</span>;
    }
    if (detailBooking.paymentStatus === 'cancelled') {
      if (isQrPaymentRejectedCancelled(detailBooking)) {
        return <span className="status rejected">Đã hủy</span>;
      }
      return <span className="status cancelled">Đã hủy</span>;
    }
    if (detailBooking.checkedOutAt) return <span className="status checked-out">Đã checkout</span>;
    if (detailBooking.checkedInAt) return <span className="status checked-in">Đã checkin</span>;
    if (detailBooking.paymentStatus === 'paid') return <span className="status paid">Đã thanh toán</span>;
    if (detailBooking.paymentStatus === 'pending') {
      if (detailBooking.paymentMethod === 'qr_code' && detailBooking.qrPaymentReportedAt) {
        return <span className="status pending">Chờ xác nhận thanh toán</span>;
      }
      return <span className="status pending">Chờ thanh toán</span>;
    }
    return <span className="status">{detailBooking.paymentStatus}</span>;
  };

  const handleContinuePaymentFromDetail = async () => {
    if (!booking) return;
    if (booking.paymentMethod === 'vnpay') {
      try {
        setPayingBookingId(booking._id);
        onError?.(null);
        const res = await api.payment.createVNPayPaymentUrl(booking._id);
        window.location.href = res.paymentUrl;
      } catch (err) {
        const msg = typeof err === 'string' ? err : err?.message || 'Không thể tạo link thanh toán';
        onError?.(msg);
      } finally {
        setPayingBookingId(null);
      }
      return;
    }

    navigate('/booking/new', { state: { bookingId: booking._id } });
  };

  const handleConfirmQrPaymentFromDetail = async () => {
    if (!booking?._id) return;
    try {
      if (!booking?.qrPaymentProofUrl && !detailProofImage) {
        onError?.('Vui lòng tải ảnh minh chứng chuyển khoản trước khi xác nhận thanh toán.');
        return;
      }

      setConfirmingQrBookingId(booking._id);
      onError?.(null);
      const res = await api.payment.confirmQrPayment({
        bookingId: booking._id,
        proofImage: detailProofImage,
      });
      const reportedAt = res.qrPaymentReportedAt || new Date().toISOString();
      onDetailBookingChange((prev) =>
        prev
          ? {
              ...prev,
              qrPaymentReportedAt: reportedAt,
              qrPaymentProofUrl: res.qrPaymentProofUrl || prev.qrPaymentProofUrl,
            }
          : prev
      );
      onListBookingPatch?.(booking._id, {
        qrPaymentReportedAt: reportedAt,
        qrPaymentProofUrl: res.qrPaymentProofUrl,
      });
      setDetailProofImage(null);
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Không thể xác nhận đã chuyển khoản';
      onError?.(msg);
    } finally {
      setConfirmingQrBookingId(null);
    }
  };

  return (
    <div className="booking-detail-modal-overlay" onClick={onClose}>
      <div className="booking-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-x" onClick={onClose} aria-label="Đóng">
          ×
        </button>
        <h2>Chi tiết đặt phòng</h2>
        {loading && <div className="loading">Đang tải chi tiết...</div>}
        {!loading && booking && (
          <div className="detail-grid">
            <div className="detail-layout">
              <div className="detail-left">
                <div className="image-section">
                  <h3>{booking.hotel?.name || 'Khách sạn'}</h3>
                  {booking.hotel?.images?.length ? (
                    <div className="detail-gallery">
                      <button
                        type="button"
                        className="gallery-nav prev"
                        onClick={() =>
                          setHotelImageIndex((prev) => (prev === 0 ? booking.hotel.images.length - 1 : prev - 1))
                        }
                      >
                        <FaChevronLeft />
                      </button>
                      <img src={getImageUrl(booking.hotel.images[hotelImageIndex])} alt={booking.hotel?.name} />
                      <button
                        type="button"
                        className="gallery-nav next"
                        onClick={() =>
                          setHotelImageIndex((prev) => (prev === booking.hotel.images.length - 1 ? 0 : prev + 1))
                        }
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  ) : (
                    <div className="no-image">Không có ảnh khách sạn</div>
                  )}
                </div>
                <div className="image-section">
                  <h3>Hình ảnh phòng</h3>
                  {booking.room?.images?.length ? (
                    <div className="detail-gallery">
                      <button
                        type="button"
                        className="gallery-nav prev"
                        onClick={() =>
                          setRoomImageIndex((prev) => (prev === 0 ? booking.room.images.length - 1 : prev - 1))
                        }
                      >
                        <FaChevronLeft />
                      </button>
                      <img src={getImageUrl(booking.room.images[roomImageIndex])} alt={booking.room?.roomNumber || 'Room'} />
                      <button
                        type="button"
                        className="gallery-nav next"
                        onClick={() =>
                          setRoomImageIndex((prev) => (prev === booking.room.images.length - 1 ? 0 : prev + 1))
                        }
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  ) : (
                    <div className="no-image">Không có ảnh phòng</div>
                  )}
                </div>
              </div>
              <div className="detail-right">
                <div className="detail-block">
                  <h3>Thông tin phòng</h3>
                  <p><strong>Số phòng:</strong> {booking.room?.roomNumber || 'N/A'}</p>
                  <p><strong>Loại phòng:</strong> {formatRoomType(booking.room?.type)}</p>
                  <p><strong>Giá phòng:</strong> {getRoomPrice(booking.room?.price).toLocaleString('vi-VN')} VNĐ/đêm</p>
                  <p><strong>Số người tối đa:</strong> {booking.room?.maxPeople || 'N/A'} người</p>
                  <p><strong>Mô tả:</strong> {booking.room?.description || 'N/A'}</p>
                </div>
                <div className="detail-block">
                  <h3>Thông tin đặt phòng</h3>
                  <p><strong>Mã đơn:</strong> {booking._id}</p>
                  <p><strong>Ngày đặt:</strong> {formatDate(booking.createdAt)}</p>
                  <p><strong>Khách sạn:</strong> {booking.hotel?.name || 'N/A'}</p>
                  <p><strong>Địa chỉ:</strong> {formatAddressText(booking.hotel?.address)}</p>
                  <p><strong>Nhận phòng:</strong> {formatDate(booking.checkInDate)}</p>
                  <p><strong>Trả phòng:</strong> {formatDate(booking.checkOutDate)}</p>
                  <p><strong>Tổng tiền:</strong> {(booking.finalAmount || 0).toLocaleString('vi-VN')} VNĐ</p>
                  <p><strong>Trạng thái:</strong> {renderBookingStatus(booking)}</p>
                  {needsQrProofResubmit(booking) && (
                    <div className="owner-rejection-notice owner-rejection-notice--resubmit">
                      <strong>Khách sạn yêu cầu tải lại minh chứng:</strong>
                      <p>{booking.ownerPaymentRejectionReason || 'Minh chứng không hợp lệ'}</p>
                    </div>
                  )}
                  {isQrPaymentRejectedCancelled(booking) && (
                    <div className="owner-rejection-notice">
                      <strong>Đơn đã bị hủy:</strong>
                      <p>
                        {booking.ownerPaymentRejectionReason || 'Thanh toán chưa thành công'}. Vui lòng đặt phòng mới
                        nếu vẫn có nhu cầu.
                      </p>
                    </div>
                  )}
                  {booking.qrPaymentProofUrl && (
                    <button
                      type="button"
                      className="proof-link"
                      onClick={() => setPreviewProofUrl(getImageUrl(booking.qrPaymentProofUrl))}
                    >
                      Xem minh chứng chuyển khoản đã gửi
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="detail-block full">
              <h3>Tiện nghi phòng</h3>
              <div className="facility-list">
                {(booking.room?.facilities || []).length > 0
                  ? booking.room.facilities.map((f, idx) => <span key={idx} className="facility-tag">{f}</span>)
                  : 'Không có thông tin tiện nghi'}
              </div>
            </div>
            {booking.paymentStatus === 'pending' && (
              <div className="detail-block full payment-actions-block">
                <h3>Thanh toán</h3>
                <p className="payment-hint">
                  {needsQrProofResubmit(booking)
                    ? 'Khách sạn yêu cầu bạn tải lại ảnh minh chứng chuyển khoản hợp lệ.'
                    : booking.paymentMethod === 'qr_code' && booking.qrPaymentReportedAt
                      ? 'Bạn đã báo đã chuyển khoản. Vui lòng chờ khách sạn xác nhận.'
                      : 'Đơn chưa thanh toán. Bạn có thể tiếp tục thanh toán ngay.'}
                </p>
                <div className="payment-action-buttons">
                  <button
                    type="button"
                    className="pay-continue-btn"
                    onClick={handleContinuePaymentFromDetail}
                    disabled={
                      payingBookingId === booking._id ||
                      (booking.paymentMethod === 'qr_code' && Boolean(booking.qrPaymentReportedAt))
                    }
                  >
                    {payingBookingId === booking._id ? 'Đang mở thanh toán...' : 'Tiếp tục thanh toán'}
                  </button>
                  {booking.paymentMethod === 'qr_code' && !booking.qrPaymentReportedAt && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        className="proof-file-input"
                        onChange={(e) => setDetailProofImage(e.target.files?.[0] || null)}
                      />
                      <button
                        type="button"
                        className="pay-continue-btn"
                        onClick={handleConfirmQrPaymentFromDetail}
                        disabled={confirmingQrBookingId === booking._id}
                      >
                        {confirmingQrBookingId === booking._id ? 'Đang ghi nhận...' : 'Tôi đã chuyển khoản'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            <BookingReview
              booking={booking}
              existingReview={booking.review || null}
              onReviewUpdate={onReviewUpdate}
            />
          </div>
        )}
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
    </div>
  );
};

export default BookingDetailModal;

