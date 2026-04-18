import { useState } from 'react';
import { getImageUrl } from '@/constants/images';
import { formatCurrency } from '@/shared/utils/format';
import './BookingModal.scss';

/**
 * Booking Modal Component
 * Modal xác nhận đặt phòng với thông tin chi tiết phòng
 */
const BookingModal = ({ isOpen, room, bookingDates, onConfirm, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !room) return null;

  const handleNextImage = () => {
    if (room.images && room.images.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % room.images.length);
    }
  };

  const handlePrevImage = () => {
    if (room.images && room.images.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + room.images.length) % room.images.length);
    }
  };

  const sp = room.salePricing;
  const hasSale = sp && sp.discountAmount > 0;

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Xác nhận đặt phòng</h2>
        <div className="modal-room-details">
          {room.images && room.images.length > 0 ? (
            <div className="modal-image-container">
              <img
                src={getImageUrl(room.images[currentImageIndex])}
                alt={room.name}
                className="modal-room-image"
              />
              {room.images.length > 1 && (
                <>
                  <button type="button" className="prev-image-btn" onClick={handlePrevImage}>
                    &lt;
                  </button>
                  <button type="button" className="next-image-btn" onClick={handleNextImage}>
                    &gt;
                  </button>
                </>
              )}
            </div>
          ) : (
            <img
              src="https://via.placeholder.com/400x250?text=Không+có+hình"
              alt={room.name}
              className="modal-room-image"
            />
          )}
          <h3>{room.roomNumber || room.name}</h3>
          <p>
            <strong>Số phòng:</strong> {room.roomNumber}
          </p>
          <p>
            <strong>Loại phòng:</strong> {room.type}
          </p>
          {hasSale ? (
            <div className="modal-price-sale">
              <p>
                <strong>Giá gốc:</strong> {formatCurrency(sp.nightlyBase)} / đêm
              </p>
              <p>
                <strong>Giá sau khuyến mãi:</strong>{' '}
                <span className="modal-price-highlight">{formatCurrency(sp.finalNightly)} / đêm</span>
                {sp.displayPercentOff > 0 && (
                  <span className="modal-sale-badge">Giảm {sp.displayPercentOff}%</span>
                )}
              </p>
              {sp.nights > 1 && (
                <p>
                  <strong>Tổng cả kỳ:</strong> {formatCurrency(sp.finalAmount)}
                  <span className="modal-price-was"> ({formatCurrency(sp.basePrice)})</span>
                </p>
              )}
            </div>
          ) : (
            <p>
              <strong>Giá:</strong> {formatCurrency(sp?.nightlyBase ?? room.price?.regular)} / đêm
            </p>
          )}
          <p>
            <strong>Số lượng người tối đa:</strong> {room.maxPeople} người
          </p>
          <p>
            <strong>Tiện ích:</strong> {room.facilities?.join(', ') || 'Không có'}
          </p>
          <p>
            <strong>Mô tả:</strong> {room.description || 'Không có mô tả'}
          </p>
          <p>
            <strong>Ngày nhận phòng:</strong> {bookingDates.checkInDate}
          </p>
          <p>
            <strong>Ngày trả phòng:</strong> {bookingDates.checkOutDate}
          </p>
        </div>
        <div className="modal-actions">
          <button type="button" className="confirm-btn" onClick={onConfirm}>
            Tiếp tục (Đặt phòng)
          </button>
          <button type="button" className="cancel-btn" onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
