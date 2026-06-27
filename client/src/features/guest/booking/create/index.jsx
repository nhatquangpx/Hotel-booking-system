import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { GuestLayout } from '@/features/guest/components/layout';
import { useAuth, usePendingHoldCountdown } from '@/shared/hooks';
import api from '../../../../apis';
import { getImageUrl, IMAGE_PATHS } from '../../../../constants/images';
import { formatDate, getRoomPrice, shouldShowPendingHoldCountdown, isPendingHoldTrackable, isPendingHoldExpiredBooking } from '@/shared/utils';
import { formatRoomType } from '@/constants/roomTypes';
import GuestSalePricingBreakdown from '@/features/guest/components/GuestSalePricingBreakdown';
import './Booking.scss';

/**
 * Guest Booking Create page feature
 * Create new booking page for guest users
 */
const GuestBookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingData = location.state || {};
  const resumeBookingId = bookingData.bookingId || searchParams.get('bookingId');
  
  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    paymentMethod: 'qr_code',
    specialRequests: ''
  });
  const [finalAmount, setFinalAmount] = useState(0);
  const [pricePreview, setPricePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPaymentQRCode, setShowPaymentQRCode] = useState(false);
  const [guest, setGuest] = useState(null);
  const [vnpayResuming, setVnpayResuming] = useState(false);
  const [confirmingQrPayment, setConfirmingQrPayment] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const [previewProofUrl, setPreviewProofUrl] = useState(null);
  const [qrActionError, setQrActionError] = useState('');
  const [hotelImageIndex, setHotelImageIndex] = useState(0);
  const [roomImageIndex, setRoomImageIndex] = useState(0);
  const { user, isAuthenticated, sessionChecked } = useAuth();

  useEffect(() => {
    if (!sessionChecked) return;

    const needsAuth =
      resumeBookingId ||
      (bookingData.hotelId &&
        bookingData.roomId &&
        bookingData.checkInDate &&
        bookingData.checkOutDate);

    if (needsAuth && !isAuthenticated) {
      navigate('/login', { replace: true, state: { from: location } });
    }
  }, [
    sessionChecked,
    isAuthenticated,
    resumeBookingId,
    bookingData.hotelId,
    bookingData.roomId,
    bookingData.checkInDate,
    bookingData.checkOutDate,
    location,
    navigate,
  ]);

  const hideBookingForm =
    Boolean(resumeBookingId && booking) &&
    booking.paymentStatus === 'pending' &&
    booking.paymentMethod === 'vnpay';

  const checkInDisplay = booking?.checkInDate ?? bookingData.checkInDate;
  const checkOutDisplay = booking?.checkOutDate ?? bookingData.checkOutDate;

  const transferContent =
    guest && hotel && room && checkInDisplay && checkOutDisplay
      ? `${guest.name || ''} - ${hotel.name || ''} - ${room.roomNumber || ''} - ${formatDate(checkInDisplay)} - ${formatDate(checkOutDisplay)}`
      : null;
  const qrConfig = hotel?.paymentConfig?.qr || null;
  const qrIsEnabled = Boolean(qrConfig?.isConfigured);
  /** Chỉ tin cờ từ server; không kiểm tra tmnCode/secureSecret trên client (secret không được gửi ra browser). */
  const vnpayIsEnabled = Boolean(hotel?.paymentConfig?.vnpay?.isConfigured);
  const qrImageSrc = getImageUrl(qrConfig?.qrImageUrl || IMAGE_PATHS.QR_CODE) || IMAGE_PATHS.QR_CODE;

  const qrPaymentReported = booking?.paymentMethod === 'qr_code' && Boolean(booking?.qrPaymentReportedAt);
  const holdTrackable = showPaymentQRCode && isPendingHoldTrackable(booking);
  const showActiveCountdown = showPaymentQRCode && shouldShowPendingHoldCountdown(booking);
  const handleHoldExpired = useCallback(() => {
    navigate('/my-bookings');
  }, [navigate]);
  const { formatted: holdCountdown, expired: holdExpired } = usePendingHoldCountdown(
    booking?.pendingExpiresAt,
    { enabled: holdTrackable, onExpired: handleHoldExpired }
  );
  const shouldRenderErrorFallback = Boolean(
    error && !hotel && !room && !booking && !showPaymentQRCode
  );

  useEffect(() => {
    if (!sessionChecked || !isAuthenticated) return;

    if (resumeBookingId) {
      const fetchBooking = async () => {
        try {
          setLoading(true);
          const bookingRes = await api.userBooking.getBookingById(resumeBookingId);
          if (bookingRes.paymentStatus === 'cancelled') {
            setError('Đơn đặt phòng đã bị hủy.');
            setLoading(false);
            return;
          }
          if (bookingRes.paymentStatus === 'paid') {
            setError('Đơn đặt phòng đã được thanh toán.');
            setLoading(false);
            return;
          }
          if (isPendingHoldExpiredBooking(bookingRes)) {
            setError('Đơn đã quá thời hạn giữ phòng chưa thanh toán. Vui lòng đặt phòng mới.');
            setLoading(false);
            return;
          }
          setBooking(bookingRes);
          setGuest(bookingRes.guest);
          setHotel(bookingRes.hotel);
          setRoom(bookingRes.room);
          setFinalAmount(bookingRes.finalAmount);
          if (bookingRes.paymentMethod === 'qr_code') {
            setSuccessMessage(
              bookingRes.qrPaymentReportedAt
                ? 'Bạn đã báo đã chuyển khoản. Vui lòng chờ khách sạn xác nhận.'
                : 'Vui lòng quét mã QR để hoàn tất thanh toán.'
            );
            setShowPaymentQRCode(true);
          }
          setLoading(false);
        } catch (err) {
          setError('Không thể tải thông tin đặt phòng');
          setLoading(false);
        }
      };
      fetchBooking();
      return;
    }
    if (!bookingData.hotelId || !bookingData.roomId || !bookingData.checkInDate || !bookingData.checkOutDate) {
      setError('Thông tin đặt phòng không đầy đủ');
      setLoading(false);
      return;
    }
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const guestResponse = await api.user.getUserProfile();
        setGuest(guestResponse);
        const hotelResponse = await api.userHotel.getHotelById(bookingData.hotelId, {
          forBooking: true
        });
        setHotel(hotelResponse);
        const roomResponse = await api.userRoom.getRoomById(bookingData.roomId);
        setRoom(roomResponse);
        try {
          const preview = await api.userBooking.getPricePreview({
            hotelId: bookingData.hotelId,
            roomId: bookingData.roomId,
            checkInDate: bookingData.checkInDate,
            checkOutDate: bookingData.checkOutDate,
          });
          setPricePreview(preview);
          setFinalAmount(preview.finalAmount ?? 0);
          setError(null);
        } catch (previewErr) {
          const status = previewErr?.response?.status;
          const msg = previewErr?.response?.data?.message;
          if ((status === 400 || status === 404) && msg) {
            setError(msg);
            setPricePreview(null);
            setFinalAmount(0);
          } else {
            const checkInDate = new Date(bookingData.checkInDate);
            const checkOutDate = new Date(bookingData.checkOutDate);
            const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
            const nightly = getRoomPrice(roomResponse.price);
            setPricePreview(null);
            setFinalAmount(nightly * nights);
          }
        }
        setLoading(false);
      } catch (err) {
        setError('Không thể tải thông tin đặt phòng');
        setLoading(false);
      }
    };
    fetchBookingDetails();
  }, [bookingData, user, resumeBookingId, sessionChecked, isAuthenticated]);

  const handleResumeVNPay = async () => {
    if (!booking?._id) return;
    try {
      setVnpayResuming(true);
      setError(null);
      const paymentResponse = await api.payment.createVNPayPaymentUrl(booking._id);
      window.location.href = paymentResponse.paymentUrl;
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Không thể tạo link thanh toán VNPay';
      setError(msg);
      setVnpayResuming(false);
    }
  };

  const handleConfirmQrPayment = async () => {
    if (!booking?._id || holdExpired) return;
    try {
      setConfirmingQrPayment(true);
      setQrActionError('');
      const res = await api.payment.confirmQrPayment({
        bookingId: booking._id,
        proofImage
      });
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              qrPaymentReportedAt: res.qrPaymentReportedAt || new Date().toISOString(),
              qrPaymentProofUrl: res.qrPaymentProofUrl || prev.qrPaymentProofUrl,
            }
          : prev
      );
      setProofImage(null);
      setSuccessMessage('Đã ghi nhận bạn đã chuyển khoản. Vui lòng chờ khách sạn xác nhận.');
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Không thể xác nhận đã chuyển khoản';
      setQrActionError(msg);
    } finally {
      setConfirmingQrPayment(false);
    }
  };

  useEffect(() => {
    if (showPaymentQRCode && holdExpired) {
      navigate('/my-bookings');
    }
  }, [showPaymentQRCode, holdExpired, navigate]);

  useEffect(() => {
    if (resumeBookingId || !hotel) return;
    setFormData((prev) => {
      if (prev.paymentMethod === 'qr_code' && !qrIsEnabled) {
        return { ...prev, paymentMethod: 'vnpay' };
      }
      if (prev.paymentMethod === 'vnpay' && !vnpayIsEnabled) {
        return { ...prev, paymentMethod: 'qr_code' };
      }
      return prev;
    });
  }, [hotel, resumeBookingId, qrIsEnabled, vnpayIsEnabled]);

  useEffect(() => {
    setHotelImageIndex(0);
  }, [hotel?._id]);

  useEffect(() => {
    setRoomImageIndex(0);
  }, [room?._id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('guestDetails.')) {
      const guestField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        guestDetails: {
          ...prev.guestDetails,
          [guestField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async () => {
    if (!resumeBookingId) {
      try {
        setSubmitting(true);
        
        const bookingPayload = {
          guest: bookingData.guest,
          hotel: bookingData.hotelId,
          room: bookingData.roomId,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          paymentMethod: formData.paymentMethod,
          specialRequests: formData.specialRequests || ''
        };
        
        const response = await api.userBooking.createBooking(bookingPayload);
        
        // Nếu payment method là VNPay, tạo payment URL và redirect
        if (formData.paymentMethod === 'vnpay') {
          try {
            const paymentResponse = await api.payment.createVNPayPaymentUrl(response._id);
            // Redirect đến trang thanh toán VNPay
            window.location.href = paymentResponse.paymentUrl;
          } catch (paymentErr) {
            setError(paymentErr.response?.data?.message || 'Đã xảy ra lỗi khi tạo link thanh toán');
            setSubmitting(false);
            console.error(paymentErr);
          }
        } else {
          // QR code payment (giữ nguyên logic cũ)
          setBooking(response);
          setProofImage(null);
          setSuccessMessage('Đặt phòng thành công! Vui lòng quét mã QR để thanh toán.');
          setShowPaymentQRCode(true);

          setSubmitting(false);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Đã xảy ra lỗi khi đặt phòng');
        setSubmitting(false);
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <GuestLayout>
        <div className="booking-container">
          <div className="loading">Đang tải thông tin đặt phòng...</div>
        </div>
      </GuestLayout>
    );
  }

  if (shouldRenderErrorFallback) {
    return (
      <GuestLayout>
        <div className="booking-container">
          <div className="error-message">{error}</div>
          <button 
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            Quay lại
          </button>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
      <div className="booking-container">
        <h1>Đặt phòng</h1>
        {error && !shouldRenderErrorFallback && (
          <div className="error-message">{error}</div>
        )}
        
        {successMessage && !showPaymentQRCode && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        <div className="booking-content">
          <div className="booking-images">
            {hotel && hotel.images && hotel.images.length > 0 && (
              <div className="hotel-image-section">
                <h3>Khách sạn</h3>
                <div className="image-carousel">
                  <img src={getImageUrl(hotel.images[hotelImageIndex])} alt={hotel.name} className="hotel-photo" />
                  {hotel.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="image-nav prev"
                        onClick={() =>
                          setHotelImageIndex((prev) => (prev === 0 ? hotel.images.length - 1 : prev - 1))
                        }
                        aria-label="Ảnh khách sạn trước"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="image-nav next"
                        onClick={() =>
                          setHotelImageIndex((prev) => (prev === hotel.images.length - 1 ? 0 : prev + 1))
                        }
                        aria-label="Ảnh khách sạn tiếp theo"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            {room && room.images && room.images.length > 0 && (
              <div className="room-image-section">
                <h3>Phòng đã đặt</h3>
                <div className="image-carousel">
                  <img src={getImageUrl(room.images[roomImageIndex])} alt={room.name} className="room-photo" />
                  {room.images.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="image-nav prev"
                        onClick={() =>
                          setRoomImageIndex((prev) => (prev === 0 ? room.images.length - 1 : prev - 1))
                        }
                        aria-label="Ảnh phòng trước"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="image-nav next"
                        onClick={() =>
                          setRoomImageIndex((prev) => (prev === room.images.length - 1 ? 0 : prev + 1))
                        }
                        aria-label="Ảnh phòng tiếp theo"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            {showPaymentQRCode && (
              <div className="payment-qr-code-section">
                <h2>Thanh toán</h2>
                <p className="payment-instructions">Vui lòng quét mã QR dưới đây để hoàn tất thanh toán. Đơn đặt phòng của bạn sẽ được xác nhận sau khi nhận được thanh toán.</p>
                <img
                  src={qrImageSrc}
                  alt="QR Code Thanh Toán"
                  className="qr-code-image"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = IMAGE_PATHS.QR_CODE;
                  }}
                />
                <p className="payment-note">Sau khi thanh toán thành công, bạn sẽ được chuyển hướng đến trang đặt phòng của tôi.</p>
                {qrPaymentReported && (
                  <p className="payment-note">
                    Bạn đã báo đã chuyển khoản. Vui lòng chờ khách sạn xác nhận để tránh thanh toán trùng.
                  </p>
                )}
                {showActiveCountdown && holdCountdown && (
                  <div className="countdown-timer" role="status">
                    Thời hạn giữ phòng: còn{' '}
                    <span className="countdown-value">{holdCountdown}</span> — đơn sẽ tự hủy nếu
                    chưa hoàn tất thanh toán
                  </div>
                )}
                {holdTrackable && holdExpired && (
                  <div className="countdown-timer countdown-timer--expired" role="status">
                    Đơn đã quá thời hạn giữ phòng. Đang chuyển hướng…
                  </div>
                )}
                {!qrPaymentReported && booking?._id && !holdExpired && (
                  <div className="proof-upload-form">
                    <label htmlFor="qr-proof-file-create">Ảnh minh chứng <span className="required-mark">*</span></label>
                    <input
                      id="qr-proof-file-create"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setProofImage(e.target.files?.[0] || null);
                        setQrActionError('');
                      }}
                    />
                  </div>
                )}
                {!qrPaymentReported && booking?._id && !holdExpired && (
                  <button
                    className="back-to-bookings-btn"
                    onClick={handleConfirmQrPayment}
                    disabled={confirmingQrPayment || !proofImage || !qrIsEnabled}
                  >
                    {confirmingQrPayment ? 'Đang ghi nhận...' : 'Tôi đã chuyển khoản'}
                  </button>
                )}
                {!qrPaymentReported && booking?._id && !holdExpired && !proofImage && (
                  <p className="proof-required-hint">Vui lòng tải lên ảnh minh chứng trước khi xác nhận thanh toán.</p>
                )}
                {!qrPaymentReported && qrActionError && (
                  <p className="qr-action-error">{qrActionError}</p>
                )}
                {qrPaymentReported && booking?.paymentMethod === 'qr_code' && (
                  <>
                    <div className="proof-upload-form">
                      <label htmlFor="qr-proof-file-create">Cập nhật ảnh minh chứng</label>
                      <input
                        id="qr-proof-file-create"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                      />
                      {booking?.qrPaymentProofUrl && (
                        <button
                          type="button"
                          className="proof-link"
                          onClick={() => setPreviewProofUrl(getImageUrl(booking.qrPaymentProofUrl))}
                        >
                          Xem minh chứng đã gửi
                        </button>
                      )}
                    </div>
                    <button
                      className="back-to-bookings-btn"
                      onClick={handleConfirmQrPayment}
                      disabled={confirmingQrPayment || !qrIsEnabled}
                    >
                      {confirmingQrPayment ? 'Đang cập nhật...' : 'Cập nhật minh chứng'}
                    </button>
                  </>
                )}
                <button 
                  className="back-to-bookings-btn view-my-bookings-btn" 
                  onClick={() => navigate('/my-bookings')}
                >
                  Xem đơn đặt phòng của tôi
                </button>
                {previewProofUrl && (
                  <div className="proof-preview-overlay" onClick={() => setPreviewProofUrl(null)}>
                    <div className="proof-preview-modal" onClick={(e) => e.stopPropagation()}>
                      <img src={previewProofUrl} alt="Minh chứng thanh toán" />
                      <button type="button" className="close-proof-btn" onClick={() => setPreviewProofUrl(null)}>
                        Đóng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="booking-details">
            {hotel && room && (
              <>
                <div className="room-info-section">
                  <h2>Thông tin phòng</h2>
                  <div className="room-details">
                    <div className="detail-item">
                      <span className="label">Số phòng:</span>
                      <span className="value">{room.roomNumber}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Loại phòng:</span>
                      <span className="value">{formatRoomType(room.type)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Giá phòng (ước tính):</span>
                      <span className="value price">
                        {pricePreview
                          ? `${pricePreview.finalNightly?.toLocaleString('vi-VN')} VNĐ/đêm`
                          : `${getRoomPrice(room.price).toLocaleString('vi-VN')} VNĐ/đêm`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Số người tối đa:</span>
                      <span className="value">{room.maxPeople} người</span>
                    </div>
                    <div className="detail-item description">
                      <span className="label">Mô tả:</span>
                      <p className="value">{room.description}</p>
                    </div>
                    <div className="detail-item facilities">
                      <span className="label">Tiện nghi:</span>
                      <div className="facilities-list">
                        {room.facilities?.map((facility, index) => (
                          <span key={index} className="facility-tag">{facility}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="booking-summary">
                  <h2>Thông tin đặt phòng</h2>
                  <div className="summary-item">
                    <span className="label">Tên khách hàng:</span>
                    <span className="value">{guest.name || ''}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Khách sạn:</span>
                    <span className="value">{hotel.name}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Số phòng:</span>
                    <span className="value">{room.roomNumber}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Ngày nhận phòng:</span>
                    <span className="value">
                      {checkInDisplay ? new Date(checkInDisplay).toLocaleDateString('vi-VN') : '—'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Ngày trả phòng:</span>
                    <span className="value">
                      {checkOutDisplay ? new Date(checkOutDisplay).toLocaleDateString('vi-VN') : '—'}
                    </span>
                  </div>
                  {pricePreview && pricePreview.discountAmount > 0 && (
                    <div className="summary-item summary-item--sale-block">
                      <GuestSalePricingBreakdown pricing={pricePreview} variant="full" />
                    </div>
                  )}
                  <div className="summary-item total">
                    <span className="label">Tổng thanh toán:</span>
                    <span className="value price">{finalAmount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>
                {showPaymentQRCode && (
                  <div className="payment-guide-section">
                    <h2>Hướng dẫn thanh toán</h2>
                    <p>Vui lòng chuyển khoản qua tài khoản sau:</p>
                    <p>
                      Chủ tài khoản:{' '}
                      <span className="account-name">{qrConfig?.accountName || 'N/A'}</span>
                    </p>
                    <p>
                      Số tài khoản:{' '}
                      <span className="account-number">{qrConfig?.accountNumber || 'N/A'}</span>
                    </p>
                    <p>
                      Ngân hàng:{' '}
                      <span className="bank-name">{qrConfig?.bankName || 'N/A'}</span>
                    </p>
                    <p>
                      Nội dung chuyển khoản:{' '}
                      <span className="transfer-note">
                        {transferContent || 'TEN_NGUOI_DUNG - KHACH_SAN - SO_PHONG_DA_DAT - NGAY_CHECKIN - NGAY_CHECKOUT'}
                      </span>
                    </p>
                  </div>
                )}
                {hideBookingForm && (
                  <div className="booking-actions-confirm vnpay-resume-block">
                    <p className="vnpay-resume-text">
                      Đơn đặt phòng của bạn chưa thanh toán qua VNPay. Bạn có thể tiếp tục thanh toán bất cứ lúc nào.
                    </p>
                    <button
                      type="button"
                      className="submit-btn"
                      onClick={handleResumeVNPay}
                      disabled={vnpayResuming}
                    >
                      {vnpayResuming ? 'Đang chuyển đến VNPay...' : 'Tiếp tục thanh toán VNPay'}
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => navigate('/my-bookings')}
                    >
                      Về danh sách đặt phòng
                    </button>
                  </div>
                )}
                {!showPaymentQRCode && !hideBookingForm && (
                  <div className="booking-actions-confirm">
                    <div className="form-group">
                      <label>Phương thức thanh toán</label>
                      <div className="payment-method-options">
                        <label
                          className={`payment-method-option${hotel && !qrIsEnabled ? ' payment-method-option--disabled' : ''}`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="qr_code"
                            checked={formData.paymentMethod === 'qr_code'}
                            onChange={handleInputChange}
                            disabled={Boolean(hotel && !qrIsEnabled)}
                          />
                          <div className="payment-method-content">
                            <span className="payment-method-name">QR Code</span>
                            <span className="payment-method-desc">Quét mã QR để chuyển khoản</span>
                          </div>
                        </label>
                        <label
                          className={`payment-method-option${hotel && !vnpayIsEnabled ? ' payment-method-option--disabled' : ''}`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="vnpay"
                            checked={formData.paymentMethod === 'vnpay'}
                            onChange={handleInputChange}
                            disabled={Boolean(hotel && !vnpayIsEnabled)}
                          />
                          <div className="payment-method-content">
                            <span className="payment-method-name">VNPay</span>
                            <span className="payment-method-desc">
                              {hotel && !vnpayIsEnabled
                                ? 'Khách sạn chưa cấu hình VNPay merchant riêng'
                                : 'Thanh toán trực tuyến qua VNPay'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="specialRequests">Yêu cầu đặc biệt (tùy chọn)</label>
                      <textarea
                        id="specialRequests"
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Ví dụ: Yêu cầu setup trước như thế nào, hoặc cần đồ dùng đặc biệt..."
                      ></textarea>
                    </div>
                    <button
                      type="button"
                      className="submit-btn"
                      onClick={handleSubmit}
                      disabled={
                        submitting ||
                        (!resumeBookingId && Boolean(error) && !pricePreview)
                      }
                    >
                      {submitting 
                        ? (formData.paymentMethod === 'vnpay' ? 'Đang chuyển đến trang thanh toán...' : 'Đang xử lý...') 
                        : formData.paymentMethod === 'vnpay' 
                          ? 'Xác nhận đặt phòng và Thanh toán qua VNPay' 
                          : 'Xác nhận đặt phòng và Thanh toán'}
                    </button>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => navigate(-1)}
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </GuestLayout>
  );
};

export default GuestBookingPage;

