import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { GuestLayout, LoginRequiredModal } from '@/features/guest/components';
import { useAuth } from '@/shared/hooks';
import { useGuestWishlist } from '@/features/guest/hooks';
import api from '@/apis';
import HotelHeader from './HotelHeader';
import HotelGallery from './HotelGallery';
import HotelDescription from './HotelDescription';
import HotelPolicies from './HotelPolicies';
import BookingSearch from './BookingSearch';
import RoomList from './RoomList';
import BookingModal from './BookingModal';
import HotelContact from './HotelContact';
import HotelReviews from './HotelReviews';
import { getEffectiveRefundMinDaysBeforeCheckIn } from '@/shared/utils/hotelPolicies';
import {
  isGuestBookableHotel,
  getHotelStatusLabel,
  getHotelStatusBannerMessage,
} from '@/shared/utils/hotelStatus';
import './HotelDetail.scss';

/**
 * Guest Hotel Detail page feature
 * Displays detailed information about a hotel and available rooms
 */
const GuestHotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.user?.user);
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { applyWishlistedChange, isWishlisted } = useGuestWishlist();

  useEffect(() => {
    if (isAuthenticated) {
      setShowLoginModal(false);
    }
  }, [isAuthenticated]);
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  /** Lỗi tìm phòng (không dùng chung `error` để tránh che mất trang khi đã có hotel). */
  const [roomSearchError, setRoomSearchError] = useState(null);
  const [bookingDates, setBookingDates] = useState({
    checkInDate: '',
    checkOutDate: ''
  });
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setLoading(true);
        const response = await api.userHotel.getHotelById(id);
        console.log('Hotel Detail Response:', response);
        setHotel(response);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải thông tin khách sạn');
        setLoading(false);
        console.error(err);
      }
    };

    fetchHotelDetails();
  }, [id]);

  // Fetch reviews khi hotel đã load
  const fetchReviews = async () => {
    if (!hotel) return;
    const hotelId = hotel._id || hotel.id;
    if (!hotelId) return;

    try {
      setReviewsLoading(true);
      const response = await api.review.getReviewsByHotel(hotelId, reviewPage, 10);
      setReviews(response.reviews || []);
      setReviewStats(response.stats || null);
      setReviewTotalPages(response.pagination?.pages || 1);
      setReviewsLoading(false);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviews([]);
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (hotel && (hotel._id || hotel.id)) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotel, reviewPage]);

  const handleBookingDateChange = (e) => {
    const { name, value } = e.target;
    setBookingDates((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'checkInDate' && value) {
        const d = new Date(`${value}T12:00:00`);
        if (!Number.isNaN(d.getTime())) {
          d.setDate(d.getDate() + 1);
          const minOut = d.toISOString().slice(0, 10);
          if (next.checkOutDate && next.checkOutDate < minOut) {
            next.checkOutDate = minOut;
          }
        }
      }
      return next;
    });
  };

  const guestBookable =
    hotel?.guestBookable !== undefined ? hotel.guestBookable : isGuestBookableHotel(hotel);

  const searchAvailableRooms = async () => {
    if (!guestBookable) {
      setRoomSearchError(
        getHotelStatusBannerMessage(hotel?.status) ||
          'Khách sạn hiện không nhận đặt phòng mới.'
      );
      return;
    }

    if (!isAuthenticated) {
      setRoomSearchError(null);
      setShowLoginModal(true);
      return;
    }

    try {
      setLoading(true);
      setRoomSearchError(null);
      const response = await api.userBooking.getAvailableRooms(id, bookingDates.checkInDate, bookingDates.checkOutDate);
      console.log('Rooms Response:', response);
      setRooms(Array.isArray(response) ? response : []);
      setSearchPerformed(true);
      setLoading(false);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setRoomSearchError(null);
        setShowLoginModal(true);
      } else {
        const msg =
          err?.response?.data?.message || err?.message || 'Không thể tải danh sách phòng';
        setRoomSearchError(msg);
      }
      setLoading(false);
      console.error(err);
    }
  };

  const handleGoLogin = () => {
    setShowLoginModal(false);
    navigate('/login', { state: { from: location } });
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedRoom) return;

    const bookingState = {
      hotelId: id,
      roomId: selectedRoom._id,
      checkInDate: bookingDates.checkInDate,
      checkOutDate: bookingDates.checkOutDate,
    };

    if (!user) {
      navigate('/login', {
        state: {
          from: {
            pathname: '/booking/new',
            search: '',
            hash: '',
            state: bookingState,
          },
        },
      });
      setSelectedRoom(null);
      setShowBookingModal(false);
      return;
    }

    navigate('/booking/new', { state: bookingState });
    setSelectedRoom(null);
    setShowBookingModal(false);
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedRoom(null);
  };

  const handleReviewPageChange = (page) => {
    setReviewPage(page);
  };

  if (loading && !hotel) {
    return (
      <GuestLayout>
        <div className="hotel-detail-container">
          <div className="loading">Đang tải...</div>
        </div>
      </GuestLayout>
    );
  }

  if (error && !hotel) {
    return (
      <GuestLayout>
        <div className="hotel-detail-container">
          <div className="error-message">{error}</div>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
      <div className="hotel-detail-container">
        {hotel && (
          <>
            <HotelHeader
              hotel={hotel}
              isWishlisted={isWishlisted(hotel._id)}
              onWishlistedChange={applyWishlistedChange}
            />
            {!guestBookable && (
              <div className="hotel-unavailable-banner" role="alert">
                <strong>{getHotelStatusLabel(hotel.status)}</strong>
                <span>
                  {' '}
                  — {getHotelStatusBannerMessage(hotel.status)}
                </span>
              </div>
            )}
            <HotelGallery hotel={hotel} />
            <HotelDescription hotel={hotel} />
            <HotelPolicies hotel={hotel} />
            {roomSearchError ? (
              <div className="error-message hotel-detail-container__search-error" role="alert">
                {roomSearchError}
              </div>
            ) : null}
            <BookingSearch
              bookingDates={bookingDates}
              onDateChange={handleBookingDateChange}
              onSearch={searchAvailableRooms}
              loading={loading && searchPerformed}
              refundMinDaysBeforeCheckIn={getEffectiveRefundMinDaysBeforeCheckIn(hotel.policies)}
              disabled={!guestBookable}
            />
            {guestBookable ? (
              <RoomList
                rooms={rooms}
                bookingDates={bookingDates}
                onRoomSelect={handleRoomSelect}
                loading={loading}
                searchPerformed={searchPerformed}
              />
            ) : null}
            <BookingModal
              isOpen={showBookingModal}
              room={selectedRoom}
              bookingDates={bookingDates}
              onConfirm={handleConfirmBooking}
              onClose={handleCloseModal}
            />
            <LoginRequiredModal
              open={showLoginModal}
              onClose={() => setShowLoginModal(false)}
              onLogin={handleGoLogin}
              message="Bạn cần đăng nhập tài khoản trước khi tìm phòng. Vui lòng đăng nhập để tiếp tục."
            />
            <HotelContact hotel={hotel} />
            <HotelReviews
              reviews={reviews}
              reviewStats={reviewStats}
              loading={reviewsLoading}
              currentPage={reviewPage}
              totalPages={reviewTotalPages}
              onPageChange={handleReviewPageChange}
            />
          </>
        )}
      </div>
    </GuestLayout>
  );
};

export default GuestHotelDetailPage;

