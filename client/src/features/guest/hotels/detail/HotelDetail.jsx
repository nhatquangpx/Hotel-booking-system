import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { PAGE_SIZE } from '@/constants/pagination';
import {
  isGuestBookableHotel,
  getHotelStatusLabel,
  getHotelStatusBannerMessage,
} from '@/shared/utils';
import './HotelDetail.scss';

/**
 * Guest Hotel Detail page feature
 * Displays detailed information about a hotel and available rooms
 */
const GuestHotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { applyWishlistedChange, isWishlisted } = useGuestWishlist();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingBookingState, setPendingBookingState] = useState(null);
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
  const [selectedStayDates, setSelectedStayDates] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);
  const [reviewRatingFilter, setReviewRatingFilter] = useState(null);

  useEffect(() => {
    setReviewPage(1);
    setReviewRatingFilter(null);
    setReviews([]);
    setReviewStats(null);
    setReviewTotalPages(1);
  }, [id]);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setLoading(true);
        const response = await api.userHotel.getHotelById(id);
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

  useEffect(() => {
    const hotelId = hotel?._id || hotel?.id;
    if (!hotel || !hotelId || String(hotelId) !== String(id)) return;

    let cancelled = false;

    const loadReviews = async () => {
      try {
        setReviewsLoading(true);
        const response = await api.review.getReviewsByHotel(
          hotelId,
          reviewPage,
          PAGE_SIZE.HOTEL_REVIEWS,
          reviewRatingFilter
        );
        if (cancelled || String(hotelId) !== String(id)) return;
        setReviews(response.reviews || []);
        setReviewStats(response.stats || null);
        setReviewTotalPages(response.pagination?.pages || 1);
      } catch (err) {
        if (cancelled || String(hotelId) !== String(id)) return;
        console.error('Error fetching reviews:', err);
        setReviews([]);
        setReviewStats(null);
        setReviewTotalPages(1);
      } finally {
        if (!cancelled && String(hotelId) === String(id)) {
          setReviewsLoading(false);
        }
      }
    };

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [hotel, id, reviewPage, reviewRatingFilter]);

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

    try {
      setLoading(true);
      setRoomSearchError(null);
      const response = await api.userBooking.getAvailableRooms(
        id,
        bookingDates.checkInDate,
        bookingDates.checkOutDate
      );
      setRooms(Array.isArray(response) ? response : []);
      setSearchPerformed(true);
      setLoading(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || 'Không thể tải danh sách phòng';
      setRoomSearchError(msg);
      setLoading(false);
      console.error(err);
    }
  };

  const resolveStayDates = (room, overrideDates) => {
    if (overrideDates?.checkInDate && overrideDates?.checkOutDate) {
      return overrideDates;
    }
    const suggestion = room?.availability?.suggestion;
    if (room?.availability?.status === 'partial' && suggestion) {
      return {
        checkInDate: suggestion.checkInDate,
        checkOutDate: suggestion.checkOutDate,
      };
    }
    return bookingDates;
  };

  const handleConfirmBooking = () => {
    if (!selectedRoom) return;

    const stay = selectedStayDates || resolveStayDates(selectedRoom);
    const bookingState = {
      hotelId: id,
      roomId: selectedRoom._id,
      checkInDate: stay.checkInDate,
      checkOutDate: stay.checkOutDate,
    };

    if (!user) {
      setPendingBookingState(bookingState);
      setShowLoginModal(true);
      return;
    }

    navigate('/booking/new', { state: bookingState });
    setSelectedRoom(null);
    setSelectedStayDates(null);
    setShowBookingModal(false);
  };

  const handleGoLogin = () => {
    setShowLoginModal(false);
    navigate('/login', {
      state: {
        from: {
          pathname: '/booking/new',
          search: '',
          hash: '',
          state: pendingBookingState,
        },
      },
    });
    setPendingBookingState(null);
    setSelectedRoom(null);
    setSelectedStayDates(null);
    setShowBookingModal(false);
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setPendingBookingState(null);
  };

  const handleRoomSelect = (room, overrideDates) => {
    const stay = resolveStayDates(room, overrideDates);
    setSelectedRoom(room);
    setSelectedStayDates(stay);
    setShowBookingModal(true);
  };

  const handleApplySuggestedDates = async (suggestion) => {
    if (!suggestion?.checkInDate || !suggestion?.checkOutDate) return;
    const nextDates = {
      checkInDate: suggestion.checkInDate,
      checkOutDate: suggestion.checkOutDate,
    };
    setBookingDates(nextDates);

    if (!guestBookable) return;

    try {
      setLoading(true);
      setRoomSearchError(null);
      const response = await api.userBooking.getAvailableRooms(
        id,
        nextDates.checkInDate,
        nextDates.checkOutDate
      );
      setRooms(Array.isArray(response) ? response : []);
      setSearchPerformed(true);
      setLoading(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || 'Không thể tải danh sách phòng';
      setRoomSearchError(msg);
      setLoading(false);
      console.error(err);
    }
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedRoom(null);
    setSelectedStayDates(null);
  };

  const handleReviewPageChange = (page) => {
    setReviewPage(page);
  };

  const handleReviewRatingFilterChange = (rating) => {
    setReviewRatingFilter(rating);
    setReviewPage(1);
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
            {!guestBookable && (
              <div className="hotel-unavailable-banner" role="alert">
                <strong>{getHotelStatusLabel(hotel.status)}</strong>
                <span>
                  {' '}
                  — {getHotelStatusBannerMessage(hotel.status)}
                </span>
              </div>
            )}

            <div className="hotel-detail-hero">
              <div className="hotel-detail-hero__main">
                <HotelHeader
                  hotel={hotel}
                  isWishlisted={isWishlisted(hotel._id)}
                  onWishlistedChange={applyWishlistedChange}
                />
                <HotelGallery hotel={hotel} />
                {!searchPerformed ? <HotelDescription hotel={hotel} /> : null}
              </div>
              <aside className="hotel-detail-hero__sidebar">
                {roomSearchError ? (
                  <div
                    className="error-message hotel-detail-container__search-error"
                    role="alert"
                  >
                    {roomSearchError}
                  </div>
                ) : null}
                <div className="hotel-detail-hero__sidebar-panel">
                  <BookingSearch
                    bookingDates={bookingDates}
                    onDateChange={handleBookingDateChange}
                    onSearch={searchAvailableRooms}
                    loading={loading && searchPerformed}
                    disabled={!guestBookable}
                  />
                  <HotelPolicies hotel={hotel} variant="sidebar" />
                  <HotelContact hotel={hotel} variant="sidebar" />
                </div>
              </aside>
            </div>

            {guestBookable ? (
              <RoomList
                rooms={rooms}
                bookingDates={bookingDates}
                onRoomSelect={handleRoomSelect}
                onApplySuggestedDates={handleApplySuggestedDates}
                loading={loading}
                searchPerformed={searchPerformed}
              />
            ) : null}

            {searchPerformed ? (
              <div className="hotel-detail-info">
                <HotelDescription hotel={hotel} />
              </div>
            ) : null}

            <BookingModal
              isOpen={showBookingModal}
              room={selectedRoom}
              bookingDates={selectedStayDates || bookingDates}
              onConfirm={handleConfirmBooking}
              onClose={handleCloseModal}
            />
            <LoginRequiredModal
              open={showLoginModal}
              onClose={handleCloseLoginModal}
              onLogin={handleGoLogin}
              message="Bạn cần đăng nhập để tiếp tục đặt phòng. Vui lòng đăng nhập để hoàn tất đơn đặt phòng của bạn."
            />
            <HotelReviews
              reviews={reviews}
              reviewStats={reviewStats}
              loading={reviewsLoading}
              currentPage={reviewPage}
              totalPages={reviewTotalPages}
              onPageChange={handleReviewPageChange}
              selectedRating={reviewRatingFilter}
              onRatingFilterChange={handleReviewRatingFilterChange}
            />
          </>
        )}
      </div>
    </GuestLayout>
  );
};

export default GuestHotelDetailPage;
