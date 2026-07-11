import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { GuestLayout } from '@/features/guest/components/layout';
import { useAuth, usePendingHoldCountdown } from '@/shared/hooks';
import api from '../../../../apis';
import { getImageUrl, IMAGE_PATHS } from '../../../../constants/images';
import { formatDate, formatCurrency, getRoomPrice, shouldShowPendingHoldCountdown, isPendingHoldTrackable, isPendingHoldExpiredBooking } from '@/shared/utils';
import { resolveProofPreviewUrl } from '@/shared/utils/media/sensitiveMedia';
import { formatRoomType } from '@/constants/roomTypes';
import { formatAddonCategory, formatAddonPricingUnit } from '@/constants/addonServices';
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
  const [guestCount, setGuestCount] = useState(1);
  const [hotelAddons, setHotelAddons] = useState([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [addonsLoading, setAddonsLoading] = useState(false);
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
  const [guestIdNumber, setGuestIdNumber] = useState('');
  const [idImageFrontFile, setIdImageFrontFile] = useState(null);
  const [idImageBackFile, setIdImageBackFile] = useState(null);
  const [profileHasIdFront, setProfileHasIdFront] = useState(false);
  const [profileHasIdBack, setProfileHasIdBack] = useState(false);
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

  const activeHotel = booking?.hotel || hotel;
  const activeRoom = booking?.room || room;
  const activeGuest = booking?.guest || guest;

  const transferContent =
    activeGuest && activeHotel && activeRoom && checkInDisplay && checkOutDisplay
      ? `${activeGuest.name || ''} - ${activeHotel.name || ''} - ${activeRoom.roomNumber || ''} - ${formatDate(checkInDisplay)} - ${formatDate(checkOutDisplay)}`
      : null;
  const qrConfig = activeHotel?.paymentConfig?.qr || null;
  const qrIsEnabled = Boolean(qrConfig?.isConfigured);
  /** Chỉ tin cờ từ server; không kiểm tra tmnCode/secureSecret trên client (secret không được gửi ra browser). */
  const vnpayIsEnabled = Boolean(activeHotel?.paymentConfig?.vnpay?.isConfigured);
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
    if (!sessionChecked || !isAuthenticated || resumeBookingId) return;

    let cancelled = false;
    const prefillIdFromProfile = async () => {
      try {
        const profile = await api.user.getUserProfile();
        if (cancelled) return;
        if (profile?.idNumber) {
          setGuestIdNumber(String(profile.idNumber).replace(/[^\d]/g, '').slice(0, 12));
        }
        setProfileHasIdFront(Boolean(profile?.hasIdImageFront || profile?.idImageFrontUrl));
        setProfileHasIdBack(Boolean(profile?.hasIdImageBack || profile?.idImageBackUrl));
      } catch {
        /* bỏ qua — khách vẫn nhập tay */
      }
    };
    prefillIdFromProfile();
    return () => {
      cancelled = true;
    };
  }, [sessionChecked, isAuthenticated, resumeBookingId]);

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
          setAddonsLoading(true);
          const addons = await api.guestAddon.getHotelAddons(bookingData.hotelId);
          setHotelAddons(Array.isArray(addons) ? addons : []);
        } catch {
          setHotelAddons([]);
        } finally {
          setAddonsLoading(false);
        }
        try {
          const preview = await api.userBooking.getPricePreview({
            hotelId: bookingData.hotelId,
            roomId: bookingData.roomId,
            checkInDate: bookingData.checkInDate,
            checkOutDate: bookingData.checkOutDate,
            guestCount: 1,
            selectedAddonIds: [],
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
    if (resumeBookingId || !bookingData.hotelId || !bookingData.roomId || !sessionChecked || !isAuthenticated) {
      return;
    }

    const refreshPreview = async () => {
      try {
        const preview = await api.userBooking.getPricePreview({
          hotelId: bookingData.hotelId,
          roomId: bookingData.roomId,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          guestCount,
          selectedAddonIds,
        });
        setPricePreview(preview);
        setFinalAmount(preview.finalAmount ?? 0);
        setError(null);
      } catch (previewErr) {
        const msg = previewErr?.response?.data?.message || previewErr?.message;
        if (msg) {
          setError(msg);
          setPricePreview(null);
          setFinalAmount(0);
        }
      }
    };

    refreshPreview();
  }, [
    resumeBookingId,
    bookingData.hotelId,
    bookingData.roomId,
    bookingData.checkInDate,
    bookingData.checkOutDate,
    guestCount,
    selectedAddonIds,
    sessionChecked,
    isAuthenticated,
  ]);

  const toggleAddon = (addonId) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const guestCountInvalid =
    room && (Number(guestCount) < 1 || Number(guestCount) > room.maxPeople);
  const guestIdNumberNormalized = String(guestIdNumber || '').replace(/\s+/g, '').trim();
  const guestIdInvalid = !/^\d{9}$|^\d{12}$/.test(guestIdNumberNormalized);
  const guestIdImagesMissing =
    !Boolean(idImageFrontFile || profileHasIdFront) ||
    !Boolean(idImageBackFile || profileHasIdBack);

  const closeProofPreview = () => {
    setPreviewProofUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handlePreviewProof = async () => {
    if (!booking?._id || !booking.qrPaymentProofUrl) return;
    try {
      const url = await resolveProofPreviewUrl({
        roleScope: 'guest',
        bookingId: booking._id,
        kind: 'qr-proof',
        mediaRef: booking.qrPaymentProofUrl,
      });
      setPreviewProofUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return url;
      });
    } catch {
      setQrActionError('Không thể tải ảnh minh chứng');
    }
  };
  const guestCountError =
    room && Number(guestCount) > room.maxPeople
      ? `Số khách vượt quá sức chứa tối đa (${room.maxPeople} người)`
      : Number(guestCount) < 1
        ? 'Số khách phải từ 1 trở lên'
        : '';

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
          guestCount: Number(guestCount),
          selectedAddonIds,
          paymentMethod: formData.paymentMethod,
          specialRequests: formData.specialRequests || '',
          guestIdNumber: String(guestIdNumber || '').replace(/\s+/g, '').trim(),
        };

        const idDigits = bookingPayload.guestIdNumber;
        if (!/^\d{9}$|^\d{12}$/.test(idDigits)) {
          setError('Vui lòng nhập số CCCD/CMND hợp lệ (9 hoặc 12 chữ số)');
          setSubmitting(false);
          return;
        }

        const hasFront = Boolean(idImageFrontFile || profileHasIdFront);
        const hasBack = Boolean(idImageBackFile || profileHasIdBack);
        if (!hasFront || !hasBack) {
          setError(
            'Vui lòng tải đủ ảnh CCCD mặt trước và mặt sau (ảnh đã có trên hồ sơ được dùng nếu không chọn lại)'
          );
          setSubmitting(false);
          return;
        }

        const response = await api.userBooking.createBooking(bookingPayload, {
          front: idImageFrontFile,
          back: idImageBackFile,
        });
        
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
          setGuest(response?.guest || guest);
          setHotel(response?.hotel || hotel);
          setRoom(response?.room || room);
          setFinalAmount(response?.finalAmount ?? finalAmount);
          setProofImage(null);
          setQrActionError('');
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
                    disabled={confirmingQrPayment || !proofImage}
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
                          onClick={handlePreviewProof}
                        >
                          Xem minh chứng đã gửi
                        </button>
                      )}
                    </div>
                    <button
                      className="back-to-bookings-btn"
                      onClick={handleConfirmQrPayment}
                      disabled={confirmingQrPayment}
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
                  <div className="proof-preview-overlay" onClick={closeProofPreview}>
                    <div className="proof-preview-modal" onClick={(e) => e.stopPropagation()}>
                      <img src={previewProofUrl} alt="Minh chứng thanh toán" />
                      <button type="button" className="close-proof-btn" onClick={closeProofPreview}>
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

                <div className="booking-section booking-info-section">
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
                  {(showPaymentQRCode || hideBookingForm) && (
                    <div className="summary-item">
                      <span className="label">Số khách lưu trú:</span>
                      <span className="value">{booking?.guestCount ?? guestCount} người</span>
                    </div>
                  )}
                </div>

                {!showPaymentQRCode && !hideBookingForm && (
                  <div className="booking-section booking-options-section">
                    <h2>Thông tin bổ sung</h2>
                    <p className="section-desc">
                      Nhập số khách, CCCD và dịch vụ đi kèm (nếu có). Tổng chi phí sẽ hiển thị ở cuối trang.
                    </p>

                    <div className="form-group guest-count-group">
                      <label htmlFor="guestCount">Số khách lưu trú</label>
                      <div className="guest-count-row">
                        <input
                          id="guestCount"
                          name="guestCount"
                          type="number"
                          min={1}
                          max={room?.maxPeople || 50}
                          value={guestCount}
                          onChange={(e) => setGuestCount(e.target.value)}
                          className="guest-count-input"
                        />
                        <span className="guest-count-cap">/ tối đa {room?.maxPeople} người</span>
                      </div>
                      {guestCountError ? (
                        <p className="field-error" role="alert">
                          {guestCountError}
                        </p>
                      ) : (
                        <p className="field-hint">Nhập số khách thực tế sẽ lưu trú tại phòng</p>
                      )}
                    </div>

                    <div className="form-group guest-id-group">
                      <label htmlFor="guestIdNumber">
                        Số CCCD/CMND <span className="required-mark" aria-hidden="true">*</span>
                      </label>
                      <input
                        id="guestIdNumber"
                        name="guestIdNumber"
                        type="text"
                        inputMode="numeric"
                        maxLength={12}
                        value={guestIdNumber}
                        onChange={(e) => setGuestIdNumber(e.target.value.replace(/[^\d]/g, ''))}
                        placeholder="Nhập 9 hoặc 12 chữ số"
                        className="guest-id-input"
                        required
                      />
                      {guestIdNumber && guestIdInvalid ? (
                        <p className="field-error" role="alert">
                          Số CCCD/CMND phải gồm 9 hoặc 12 chữ số
                        </p>
                      ) : (
                        <p className="field-hint">Dùng để đối chiếu khi check-in tại khách sạn</p>
                      )}
                    </div>

                    <div className="form-group guest-id-images-group">
                      <label>Ảnh CCCD</label>
                      <p className="field-hint">Ảnh lưu bảo mật. Tối đa 8MB mỗi mặt.</p>
                      <div className="guest-id-images-list">
                        <label
                          htmlFor="idImageFront"
                          className={`guest-id-image-item${
                            idImageFrontFile || profileHasIdFront ? ' guest-id-image-item--selected' : ''
                          }`}
                        >
                          <input
                            id="idImageFront"
                            name="idImageFront"
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="guest-id-image-input"
                            onChange={(e) => setIdImageFrontFile(e.target.files?.[0] || null)}
                          />
                          <div className="guest-id-image-content">
                            <span className="guest-id-image-name">Mặt trước</span>
                            <span className="guest-id-image-meta">
                              {idImageFrontFile
                                ? idImageFrontFile.name
                                : profileHasIdFront
                                  ? 'Đã có trên hồ sơ — chọn để thay ảnh mới'
                                  : 'Chọn ảnh JPEG, PNG, GIF hoặc WebP'}
                            </span>
                          </div>
                        </label>

                        <label
                          htmlFor="idImageBack"
                          className={`guest-id-image-item${
                            idImageBackFile || profileHasIdBack ? ' guest-id-image-item--selected' : ''
                          }`}
                        >
                          <input
                            id="idImageBack"
                            name="idImageBack"
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            className="guest-id-image-input"
                            onChange={(e) => setIdImageBackFile(e.target.files?.[0] || null)}
                          />
                          <div className="guest-id-image-content">
                            <span className="guest-id-image-name">Mặt sau</span>
                            <span className="guest-id-image-meta">
                              {idImageBackFile
                                ? idImageBackFile.name
                                : profileHasIdBack
                                  ? 'Đã có trên hồ sơ — chọn để thay ảnh mới'
                                  : 'Chọn ảnh JPEG, PNG, GIF hoặc WebP'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {hotelAddons.length > 0 && (
                      <div className="form-group addon-services-group">
                        <label>Dịch vụ đi kèm (tùy chọn)</label>
                        {addonsLoading ? (
                          <p className="addon-services-loading">Đang tải dịch vụ...</p>
                        ) : (
                          <div className="addon-services-list">
                            {hotelAddons.map((addon) => {
                              const selected = selectedAddonIds.includes(addon._id);
                              return (
                                <label
                                  key={addon._id}
                                  className={`addon-service-item${selected ? ' addon-service-item--selected' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleAddon(addon._id)}
                                  />
                                  <div className="addon-service-content">
                                    <span className="addon-service-name">{addon.name}</span>
                                    <span className="addon-service-meta">
                                      {formatAddonCategory(addon.category)} ·{' '}
                                      {addon.price.toLocaleString('vi-VN')} VNĐ ·{' '}
                                      {formatAddonPricingUnit(addon.pricingUnit)}
                                    </span>
                                    {addon.description ? (
                                      <span className="addon-service-desc">{addon.description}</span>
                                    ) : null}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="specialRequests">Yêu cầu đặc biệt (tùy chọn)</label>
                      <textarea
                        id="specialRequests"
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Ví dụ: Yêu cầu setup trước như thế nào, hoặc cần đồ dùng đặc biệt..."
                      />
                    </div>
                  </div>
                )}

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
                  <div className="booking-section booking-payment-section">
                    <h2>Thanh toán</h2>
                    <p className="section-desc">Chọn phương thức thanh toán phù hợp.</p>
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
                  </div>
                )}

                <div className="booking-section booking-price-section">
                  <h2>Tổng chi phí</h2>
                  {!showPaymentQRCode && !hideBookingForm && (
                    <div className="summary-item">
                      <span className="label">Số khách lưu trú:</span>
                      <span className="value">{guestCount} người</span>
                    </div>
                  )}
                  {pricePreview ? (
                    <>
                      <div className="summary-item">
                        <span className="label">
                          Tiền phòng{pricePreview.nights ? ` (${pricePreview.nights} đêm)` : ''}
                        </span>
                        <span className="value">
                          {pricePreview.discountAmount > 0 ? (
                            <span className="price-with-discount">
                              <span className="price-original">
                                {formatCurrency(pricePreview.basePrice)}
                              </span>
                              <span className="price-after-discount">
                                {formatCurrency(pricePreview.roomAmount ?? pricePreview.finalAmount - (pricePreview.addonsAmount || 0))}
                              </span>
                            </span>
                          ) : (
                            <span className="price">
                              {formatCurrency(pricePreview.roomAmount ?? pricePreview.basePrice ?? 0)}
                            </span>
                          )}
                        </span>
                      </div>
                      {pricePreview.discountAmount > 0 && (
                        <div className="summary-item summary-item--discount">
                          <span className="label">Giảm khuyến mãi</span>
                          <span className="value price-discount">
                            −{formatCurrency(pricePreview.discountAmount)}
                          </span>
                        </div>
                      )}
                      {pricePreview.discountAmount > 0 && (
                        <div className="summary-item summary-item--sale-block">
                          <GuestSalePricingBreakdown
                            pricing={{
                              ...pricePreview,
                              finalAmount:
                                pricePreview.roomAmount ??
                                pricePreview.finalAmount - (pricePreview.addonsAmount || 0),
                            }}
                            variant="full"
                          />
                        </div>
                      )}
                      {(pricePreview.addonsAmount ?? 0) > 0 && (
                        <div className="summary-item">
                          <span className="label">Dịch vụ đi kèm</span>
                          <span className="value price">
                            {formatCurrency(pricePreview.addonsAmount)}
                          </span>
                        </div>
                      )}
                    </>
                  ) : null}
                  <div className="summary-item total">
                    <span className="label">Tổng thanh toán</span>
                    <span className="value price">{finalAmount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>

                {!showPaymentQRCode && !hideBookingForm && (
                  <div className="booking-actions-confirm booking-actions-confirm--final">
                    <button
                      type="button"
                      className="submit-btn"
                      onClick={handleSubmit}
                      disabled={
                        submitting ||
                        guestCountInvalid ||
                        guestIdInvalid ||
                        guestIdImagesMissing ||
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

