import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GuestLayout } from '@/features/guest/components/layout';
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
import './HotelDetail.scss';

/**
 * Guest Hotel Detail page feature
 * Displays detailed information about a hotel and available rooms
 */
const GuestHotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    setBookingDates(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const searchAvailableRooms = async () => {
    try {
      setLoading(true);
      const response = await api.userBooking.getAvailableRooms(id, bookingDates.checkInDate, bookingDates.checkOutDate);
      console.log('Rooms Response:', response);
      setRooms(Array.isArray(response) ? response : []);
      setSearchPerformed(true);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách phòng');
      setLoading(false);
      console.error(err);
    }
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = () => {
    if (selectedRoom) {
      navigate(`/booking/new`, {
        state: {
          hotelId: id,
          roomId: selectedRoom._id,
          checkInDate: bookingDates.checkInDate,
          checkOutDate: bookingDates.checkOutDate
        }
      });
    }
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
            <HotelHeader hotel={hotel} />
            <HotelGallery hotel={hotel} />
            <HotelDescription hotel={hotel} />
            <HotelPolicies hotel={hotel} />
            <BookingSearch
              bookingDates={bookingDates}
              onDateChange={handleBookingDateChange}
              onSearch={searchAvailableRooms}
              loading={loading && searchPerformed}
            />
            <RoomList
              rooms={rooms}
              onRoomSelect={handleRoomSelect}
              loading={loading}
              searchPerformed={searchPerformed}
            />
            <BookingModal
              isOpen={showBookingModal}
              room={selectedRoom}
              bookingDates={bookingDates}
              onConfirm={handleConfirmBooking}
              onClose={handleCloseModal}
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

