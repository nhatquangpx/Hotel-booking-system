import React, { useState } from 'react';
import { FaEdit, FaClock, FaMoneyCheckAlt } from 'react-icons/fa';
import Dialog from '@/components/ui/Dialog';
import { getImageUrl } from '@/constants/images';
import ImageSlider from './ImageSlider';
import ImageModal from './ImageModal';
import { getHotelStatusLabel, getHotelStatusBannerMessage } from '@/shared/utils/hotelStatus';
import './HotelInfoCard.scss';

/**
 * HotelInfoCard Component
 * Displays hotel image and basic information
 * @param {Object} hotel - Hotel object with image, name, description, checkIn, checkOut
 * @param {Function} onEdit - Callback when edit button is clicked
 */
const HotelInfoCard = ({ hotel, onEdit }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const formatTime = (time) => {
    if (!time) return '';
    if (typeof time === 'string' && time.includes(':')) {
      return time;
    }
    return time;
  };

  // Lấy danh sách ảnh từ mảng images
  const getHotelImages = () => {
    if (hotel?.images && hotel.images.length > 0) {
      return hotel.images.map(img => getImageUrl(img));
    }
    return ['/assets/default-hotel.jpg'];
  };

  const images = getHotelImages();

  // Lấy check-in và check-out từ policies
  const checkInTime = hotel?.policies?.checkInTime || '14:00';
  const checkOutTime = hotel?.policies?.checkOutTime || '12:00';
  const qrPayment = hotel?.paymentConfig?.qr || {};
  const vnpayPayment = hotel?.paymentConfig?.vnpay || {};
  const qrReady = Boolean(
    String(qrPayment.accountName || '').trim() &&
    String(qrPayment.accountNumber || '').trim() &&
    String(qrPayment.bankName || '').trim() &&
    String(qrPayment.qrImageUrl || '').trim()
  );
  const vnpayReady = Boolean(vnpayPayment.isConfigured);
  const hotelStatus = hotel?.status || 'active';
  const isOperational = hotelStatus === 'active';
  const statusBannerMessage = !isOperational ? getHotelStatusBannerMessage(hotelStatus) : '';

  const handleImageClick = (index) => {
    setModalIndex(index);
    setShowModal(true);
  };

  return (
    <div className="hotel-info-card">
      {!isOperational && (
        <div className={`hotel-info-card__status-alert hotel-info-card__status-alert--${hotelStatus}`} role="alert">
          <strong>Trạng thái: {getHotelStatusLabel(hotelStatus)}</strong>
          <p>{statusBannerMessage} Quản trị viên đã thay đổi trạng thái — vui lòng kiểm tra thông báo để biết chi tiết.</p>
        </div>
      )}
      <div className="hotel-image-section">
        {images.length > 1 ? (
          <ImageSlider 
            images={images} 
            onImageClick={handleImageClick}
          />
        ) : (
          <img 
            src={images[0]} 
            alt={hotel?.name || 'Khách sạn'} 
            className="hotel-image"
            onClick={() => handleImageClick(0)}
          />
        )}
        <div className="hotel-name-overlay">
          {hotel?.name || 'StayJourney Hotel'}
        </div>
        {onEdit && (
          <button className="edit-button" onClick={onEdit}>
            <FaEdit />
            Chỉnh sửa
          </button>
        )}
        <button
          type="button"
          className="payment-detail-button"
          onClick={() => setShowPaymentDialog(true)}
        >
          <FaMoneyCheckAlt />
          Chi tiết thanh toán
        </button>
      </div>

      <ImageModal
        isOpen={showModal}
        images={images}
        initialIndex={modalIndex}
        onClose={() => setShowModal(false)}
      />

      <Dialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        title="Thông tin thanh toán khách sạn"
        maxWidth="860px"
        className="owner-payment-dialog"
      >
        <div className="owner-payment-dialog__content">
          <div className="owner-payment-dialog__columns">
            <div className="owner-payment-dialog__column owner-payment-dialog__column--qr">
              <h4 className="owner-payment-dialog__column-title">Chuyển khoản QR</h4>
              <div className={`owner-payment-dialog__status ${qrReady ? 'is-ready' : 'is-missing'}`}>
                {qrReady ? 'Đã cấu hình đầy đủ thanh toán QR' : 'Thiếu thông tin thanh toán QR'}
              </div>
              <div className="owner-payment-dialog__grid">
                <div>
                  <strong>Chủ tài khoản:</strong> {qrPayment.accountName || 'Chưa cấu hình'}
                </div>
                <div>
                  <strong>Số tài khoản:</strong> {qrPayment.accountNumber || 'Chưa cấu hình'}
                </div>
                <div>
                  <strong>Ngân hàng:</strong> {qrPayment.bankName || 'Chưa cấu hình'}
                </div>
              </div>
              <div className="owner-payment-dialog__qr-wrap">
                {qrPayment.qrImageUrl ? (
                  <img
                    src={getImageUrl(qrPayment.qrImageUrl)}
                    alt="Mã QR thanh toán"
                    className="owner-payment-dialog__qr-image"
                  />
                ) : (
                  <div className="owner-payment-dialog__qr-empty">Chưa có ảnh QR</div>
                )}
              </div>
            </div>

            <div className="owner-payment-dialog__column owner-payment-dialog__column--vnpay">
              <h4 className="owner-payment-dialog__column-title">VNPay merchant riêng</h4>
              <div className={`owner-payment-dialog__status ${vnpayReady ? 'is-ready' : 'is-missing'}`}>
                {vnpayReady ? 'Đã cấu hình đầy đủ VNPay merchant' : 'Chưa cấu hình VNPay merchant'}
              </div>
              <div className="owner-payment-dialog__grid owner-payment-dialog__grid--vnpay">
                <div>
                  <strong>TMN Code:</strong> {vnpayPayment.tmnCode || 'Chưa cấu hình'}
                </div>
                <div>
                  <strong>Secure Secret:</strong>{' '}
                  {vnpayReady ? 'Đã lưu trên server (không hiển thị vì lý do bảo mật)' : 'Chưa cấu hình'}
                </div>
                <div className="owner-payment-dialog__note">
                  Khi cấu hình đầy đủ, khách có thể chọn thanh toán VNPay cho khách sạn này.
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
      
      <div className="hotel-details">
        <div className="hotel-description">
          {hotel?.description || 'Khách sạn hiện đại với vị trí trung tâm, phòng ốc sạch sẽ và dịch vụ chu đáo. Chúng tôi cam kết mang đến trải nghiệm lưu trú tuyệt vời cho mọi khách hàng.'}
        </div>
        
        <div className="hotel-times">
          <div className="time-item">
            <FaClock className="time-icon" />
            <span>Check-in {formatTime(checkInTime)}</span>
          </div>
          <div className="time-item">
            <FaClock className="time-icon" />
            <span>Check-out {formatTime(checkOutTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelInfoCard;

