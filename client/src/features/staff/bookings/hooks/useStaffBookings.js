import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useStaffHotel } from '@/features/staff/context/StaffHotelContext';
import api from '@/apis';
import { apiErrorMessage, sortOwnerBookingsByCheckIn } from '@/shared/utils';
import { filterBookingList } from '@/shared/utils/filterBookingList';
import {
  getStaffActionCounts,
  filterStaffActionBookings,
  bookingNeedsStaffAction,
} from '@/shared/utils/staffBookingQueue';

export function useStaffBookings() {
  const { hotelId, loading: hotelLoading, error: hotelError } = useStaffHotel();
  const [searchParams, setSearchParams] = useSearchParams();
  const openedBookingFromUrl = useRef(false);
  const didSetDefaultView = useRef(false);
  const filterFromUrl = searchParams.get('filter');
  const [viewMode, setViewMode] = useState(() =>
    filterFromUrl === 'all' ? 'all' : 'action'
  );
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
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSearch, setActionSearch] = useState('');
  const [actionType, setActionType] = useState('all');
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
      setBookings(data);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách đặt phòng');
    } finally {
      setLoading(false);
    }
  }, [hotelId, hotelLoading, hotelError]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    didSetDefaultView.current = false;
  }, [hotelId]);

  useEffect(() => {
    setActionSearch('');
    setActionType('all');
  }, [hotelId]);

  useEffect(() => {
    if (filterFromUrl === 'action') {
      setViewMode('action');
    } else if (filterFromUrl === 'all') {
      setViewMode('all');
    }
  }, [filterFromUrl]);

  const actionCounts = useMemo(() => getStaffActionCounts(bookings), [bookings]);

  useEffect(() => {
    if (loading || hotelLoading || didSetDefaultView.current || filterFromUrl) return;
    didSetDefaultView.current = true;
    setViewMode(actionCounts.total > 0 ? 'action' : 'all');
  }, [loading, hotelLoading, filterFromUrl, actionCounts.total]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    const next = new URLSearchParams(searchParams);
    if (mode === 'action') {
      next.set('filter', 'action');
    } else {
      next.delete('filter');
    }
    setSearchParams(next, { replace: true });
  };

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
      toast.success('Check-in thành công');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Có lỗi xảy ra khi check-in'));
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
      toast.success('Check-out thành công');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Có lỗi xảy ra khi check-out'));
    } finally {
      setProcessing(false);
    }
  };

  const actionBookings = useMemo(
    () => filterStaffActionBookings(bookings, { search: actionSearch, type: actionType }),
    [bookings, actionSearch, actionType]
  );

  const filteredBookings = useMemo(() => {
    const filtered = filterBookingList(bookings, {
      showTodayOnly: false,
      showPastBookings,
      searchQuery,
      statusFilter,
      methodFilter,
      proofFilter,
    });
    return sortOwnerBookingsByCheckIn(filtered);
  }, [bookings, showPastBookings, searchQuery, statusFilter, methodFilter, proofFilter]);

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

  const emptyMessage =
    viewMode === 'action'
      ? 'Không có đơn check-in hoặc check-out hôm nay phù hợp bộ lọc.'
      : 'Không có đặt phòng phù hợp với bộ lọc';

  return {
    loading,
    error,
    viewMode,
    actionCounts,
    actionBookings,
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
    handleViewModeChange,
    actionFilters: {
      search: actionSearch,
      setSearch: setActionSearch,
      type: actionType,
      setType: setActionType,
    },
    filters: {
      searchQuery,
      setSearchQuery,
      showPastBookings,
      setShowPastBookings,
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
      bookingNeedsStaffAction,
    },
  };
}
