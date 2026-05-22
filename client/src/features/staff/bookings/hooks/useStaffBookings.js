import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStaffHotel } from '@/features/staff/context/StaffHotelContext';
import api from '@/apis';
import { isTodayCheckInOrCheckOut } from '@/shared/utils/bookingFilters';
import { filterBookingList } from '@/shared/utils/filterBookingList';

export function useStaffBookings() {
  const { hotelId, loading: hotelLoading, error: hotelError } = useStaffHotel();
  const [searchParams, setSearchParams] = useSearchParams();
  const openedBookingFromUrl = useRef(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [proofFilter, setProofFilter] = useState('all');
  const [showPastBookings, setShowPastBookings] = useState(false);
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewProofUrl, setPreviewProofUrl] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);

  const fetchBookings = useCallback(async () => {
    if (hotelLoading) return;

    if (!hotelId) {
      setBookings([]);
      setError(hotelError || 'Tài khoản chưa được gán khách sạn');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.staffBooking.getBookings();
      const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBookings(sorted);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách đặt phòng');
    } finally {
      setLoading(false);
    }
  }, [hotelId, hotelLoading, hotelError]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const openCheckInModal = (booking) => {
    setSelectedBooking(booking);
    setShowCheckInModal(true);
  };

  const openCheckOutModal = (booking) => {
    setSelectedBooking(booking);
    setShowCheckOutModal(true);
  };

  const closeModals = () => {
    setShowCheckInModal(false);
    setShowCheckOutModal(false);
    setSelectedBooking(null);
  };

  const handleCheckIn = async () => {
    if (!selectedBooking) return;

    try {
      setProcessing(true);
      const response = await api.staffBooking.checkIn(selectedBooking._id);
      setBookings((prev) =>
        prev.map((b) =>
          b._id === selectedBooking._id ? { ...b, checkedInAt: response.booking.checkedInAt } : b
        )
      );
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
      const response = await api.staffBooking.checkOut(selectedBooking._id);
      setBookings((prev) =>
        prev.map((b) =>
          b._id === selectedBooking._id ? { ...b, checkedOutAt: response.booking.checkedOutAt } : b
        )
      );
      closeModals();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi check-out');
    } finally {
      setProcessing(false);
    }
  };

  const todayBookingsCount = useMemo(
    () => bookings.filter((b) => isTodayCheckInOrCheckOut(b)).length,
    [bookings]
  );

  const filteredBookings = useMemo(
    () =>
      filterBookingList(bookings, {
        showTodayOnly,
        showPastBookings,
        searchQuery,
        statusFilter,
        methodFilter,
        proofFilter,
      }),
    [bookings, showTodayOnly, showPastBookings, searchQuery, statusFilter, methodFilter, proofFilter]
  );

  const openDetailModal = async (bookingId) => {
    try {
      setShowDetailModal(true);
      setDetailLoading(true);
      setDetailBooking(null);
      const data = await api.staffBooking.getBookingById(bookingId);
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

  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    if (!bookingId || openedBookingFromUrl.current || loading || hotelLoading) return;

    openedBookingFromUrl.current = true;
    openDetailModal(bookingId);

    const next = new URLSearchParams(searchParams);
    next.delete('bookingId');
    setSearchParams(next, { replace: true });
  }, [loading, hotelLoading, searchParams, setSearchParams]);

  const emptyMessage = showTodayOnly
    ? 'Không có đơn check-in hoặc check-out hôm nay'
    : 'Không có đặt phòng phù hợp với bộ lọc';

  return {
    loading,
    error,
    filteredBookings,
    emptyMessage,
    previewProofUrl,
    setPreviewProofUrl,
    showCheckInModal,
    showCheckOutModal,
    showDetailModal,
    selectedBooking,
    processing,
    detailLoading,
    detailBooking,
    filters: {
      searchQuery,
      setSearchQuery,
      showTodayOnly,
      setShowTodayOnly,
      showPastBookings,
      setShowPastBookings,
      todayBookingsCount,
      statusFilter,
      setStatusFilter,
      methodFilter,
      setMethodFilter,
      proofFilter,
      setProofFilter,
    },
    actions: {
      openCheckInModal,
      openCheckOutModal,
      openDetailModal,
      closeModals,
      closeDetailModal,
      handleCheckIn,
      handleCheckOut,
    },
  };
}
