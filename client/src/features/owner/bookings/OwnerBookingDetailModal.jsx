import { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { formatDate, formatDateTime } from '@/shared/utils';
import { getImageUrl } from '@/constants/images';

const OwnerBookingDetailModal = ({ show, loading, booking, onClose, onPreviewProof }) => {
  const [hotelImageIndex, setHotelImageIndex] = useState(0);
  const [roomImageIndex, setRoomImageIndex] = useState(0);

  useEffect(() => {
    if (show) {
      setHotelImageIndex(0);
      setRoomImageIndex(0);
    }
  }, [show, booking?._id]);

  if (!show) return null;

  return (
    <div className="confirmation-modal-overlay" onClick={onClose}>
      <div className="confirmation-modal booking-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-x" onClick={onClose} aria-label="Đóng">
          ×
        </button>
        <h3>Chi tiết đơn đặt phòng</h3>
        {loading && <p>Đang tải chi tiết...</p>}
        {!loading && booking && (
          <div className="owner-detail-layout">
            <div className="detail-left">
              <div className="image-section">
                <h4>{booking.hotel?.name || 'Khách sạn'}</h4>
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
                <h4>Hình ảnh phòng</h4>
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
                    <img src={getImageUrl(booking.room.images[roomImageIndex])} alt={booking.room?.roomNumber} />
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
              <div className="modal-booking-info">
                <div className="info-row">
                  <span className="info-label">Mã đơn:</span>
                  <span className="info-value"><strong>{booking._id}</strong></span>
                </div>
                <div className="info-row">
                  <span className="info-label">Khách hàng:</span>
                  <span className="info-value">{booking.guest?.name || 'N/A'} - {booking.guest?.phone || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Khách sạn:</span>
                  <span className="info-value">{booking.hotel?.name || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phòng:</span>
                  <span className="info-value">{booking.room?.roomNumber || 'N/A'} - {booking.room?.type || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Nhận phòng:</span>
                  <span className="info-value">{formatDate(booking.checkInDate)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Trả phòng:</span>
                  <span className="info-value">{formatDate(booking.checkOutDate)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Mô tả phòng:</span>
                  <span className="info-value">{booking.room?.description || 'N/A'}</span>
                </div>
                <div className="info-row facilities-row">
                  <span className="info-label">Tiện nghi:</span>
                  <div className="info-value facilities-value">
                    {booking.room?.facilities?.length ? (
                      <div className="facility-list">
                        {booking.room.facilities.map((facility, index) => (
                          <span key={`${facility}-${index}`} className="facility-tag">
                            {facility}
                          </span>
                        ))}
                      </div>
                    ) : (
                      'Không có'
                    )}
                  </div>
                </div>
                <div className="info-row total-row">
                  <span className="info-label"><strong>Tổng tiền:</strong></span>
                  <span className="info-value"><strong>{(booking.totalAmount || 0).toLocaleString('vi-VN')} VNĐ</strong></span>
                </div>
                {booking.cancellationReason && (
                  <div className="info-row">
                    <span className="info-label">Lý do hủy (khách):</span>
                    <span className="info-value">{booking.cancellationReason}</span>
                  </div>
                )}
                {booking.ownerPaymentRejectionReason && (
                  <div className="info-row">
                    <span className="info-label">Lý do từ chối (chủ KS):</span>
                    <span className="info-value">{booking.ownerPaymentRejectionReason}</span>
                  </div>
                )}
                {booking.guestCancelRequestedAt && (
                  <div className="info-row">
                    <span className="info-label">Khách hủy lúc:</span>
                    <span className="info-value">{formatDateTime(booking.guestCancelRequestedAt)}</span>
                  </div>
                )}
                {(booking.guestRefundBankAccountName ||
                  booking.guestRefundBankAccountNumber ||
                  booking.guestRefundBankName) && (
                  <div className="info-row">
                    <span className="info-label">STK nhận hoàn:</span>
                    <span className="info-value">
                      {[booking.guestRefundBankAccountName, booking.guestRefundBankAccountNumber, booking.guestRefundBankName]
                        .filter(Boolean)
                        .join(' — ')}
                    </span>
                  </div>
                )}
                {booking.ownerRefundCompletedAt && (
                  <div className="info-row">
                    <span className="info-label">Đã xác nhận hoàn tiền:</span>
                    <span className="info-value">{formatDateTime(booking.ownerRefundCompletedAt)}</span>
                  </div>
                )}
                {booking.ownerRefundProofUrl && (
                  <div className="info-row">
                    <span className="info-label">Minh chứng hoàn tiền:</span>
                    <span className="info-value">
                      <button
                        type="button"
                        className="proof-link"
                        onClick={() => onPreviewProof(getImageUrl(booking.ownerRefundProofUrl))}
                      >
                        Mở ảnh minh chứng hoàn
                      </button>
                    </span>
                  </div>
                )}
                {booking.qrPaymentProofUrl && (
                  <div className="info-row">
                    <span className="info-label">Minh chứng:</span>
                    <span className="info-value">
                      <button
                        type="button"
                        className="proof-link"
                        onClick={() => onPreviewProof(getImageUrl(booking.qrPaymentProofUrl))}
                      >
                        Mở ảnh minh chứng
                      </button>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerBookingDetailModal;

