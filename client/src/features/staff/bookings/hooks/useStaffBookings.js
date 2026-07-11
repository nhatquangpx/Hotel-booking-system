import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useStaffHotel } from '@/features/staff/context/StaffHotelContext';
import { PAGE_SIZE } from '@/constants/pagination';
import api from '@/apis';
import {
  apiErrorMessage,
  getStaffActionCounts,
  bookingNeedsStaffAction,
  isOverstayCheckout,
} from '@/shared/utils';
import { resolveProofPreviewUrl } from '@/shared/utils/media/sensitiveMedia';

export function useStaffBookings() {
  const { hotelId, loading: hotelLoading, error: hotelError } = useStaffHotel();
  const [searchParams, setSearchParams] = useSearchParams();
  const openedBookingFromUrl = useRef(false);
  const didSetDefaultView = useRef(false);
  const filterFromUrl = searchParams.get('filter');
  const [viewMode, setViewMode] = useState(() =>
    filterFromUrl === 'all' ? 'all' : 'action'
  );
  const [actionBookings, setActionBookings] = useState([]);
  const [listBookings, setListBookings] = useState([]);
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
  const [lateCheckoutFeeAmount, setLateCheckoutFeeAmount] = useState('');
  const [lateCheckoutFeeNote, setLateCheckoutFeeNote] = useState('');
  const [lateCheckoutOfflineConfirmed, setLateCheckoutOfflineConfirmed] = useState(false);
  const [previewProofUrl, setPreviewProofUrl] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);
  const [actionPage, setActionPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [actionPagination, setActionPagination] = useState({
    page: 1,
    limit: PAGE_SIZE.STAFF_BOOKINGS,
    total: 0,
    totalPages: 1,
  });
  const [allPagination, setAllPagination] = useState({
    page: 1,
    limit: PAGE_SIZE.STAFF_BOOKINGS,
    total: 0,
    totalPages: 1,
  });
  const [actionCountBookings, setActionCountBookings] = useState([]);

  const actionFilterKey = `${actionSearch}|${actionType}|${hotelId}`;
  const allFilterKey = `${searchQuery}|${statusFilter}|${methodFilter}|${proofFilter}|${showPastBookings}|${hotelId}`;

  useEffect(() => {
    setActionPage(1);
  }, [actionFilterKey]);

  useEffect(() => {
    setAllPage(1);
  }, [allFilterKey, viewMode]);

  const fetchActionCounts = useCallback(async () => {
    if (hotelLoading || !hotelId) {
      setActionCountBookings([]);
      return;
    }
    try {
      const result = await api.staffBooking.getBookings({
        view: 'action',
        all: true,
      });
      setActionCountBookings(result.items || []);
    } catch {
      setActionCountBookings([]);
    }
  }, [hotelId, hotelLoading]);

  const fetchActionBookings = useCallback(async (targetPage = actionPage) => {
    if (hotelLoading) return;

    if (!hotelId) {
      setActionBookings([]);
      setActionPagination({
        page: 1,
        limit: PAGE_SIZE.STAFF_BOOKINGS,
        total: 0,
        totalPages: 1,
      });
      setError(hotelError || 'Tài khoản chưa được gán khách sạn');
      return;
    }

    try {
      setError(null);
      const result = await api.staffBooking.getBookings({
        view: 'action',
        page: targetPage,
        limit: PAGE_SIZE.STAFF_BOOKINGS,
        actionSearch,
        actionType,
      });
      setActionBookings(result.items || []);
      setActionPagination(result.pagination);
      setActionPage(targetPage);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách đặt phòng');
    }
  }, [hotelId, hotelLoading, hotelError, actionPage, actionSearch, actionType]);

  const fetchAllBookings = useCallback(async (targetPage = allPage) => {
    if (hotelLoading) return;

    if (!hotelId) {
      setListBookings([]);
      setAllPagination({
        page: 1,
        limit: PAGE_SIZE.STAFF_BOOKINGS,
        total: 0,
        totalPages: 1,
      });
      setError(hotelError || 'Tài khoản chưa được gán khách sạn');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await api.staffBooking.getBookings({
        view: 'all',
        page: targetPage,
        limit: PAGE_SIZE.STAFF_BOOKINGS,
        showPastBookings: showPastBookings ? 'true' : 'false',
        statusFilter,
        methodFilter,
        proofFilter,
        search: searchQuery,
      });
      setListBookings(result.items || []);
      setAllPagination(result.pagination);
      setAllPage(targetPage);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách đặt phòng');
    } finally {
      setLoading(false);
    }
  }, [
    hotelId,
    hotelLoading,
    hotelError,
    allPage,
    showPastBookings,
    statusFilter,
    methodFilter,
    proofFilter,
    searchQuery,
  ]);

  const reloadBookings = useCallback(async () => {
    if (viewMode === 'action') {
      await Promise.all([fetchActionBookings(actionPage), fetchActionCounts()]);
    } else {
      await fetchAllBookings(allPage);
    }
  }, [viewMode, fetchActionBookings, fetchAllBookings, fetchActionCounts, actionPage, allPage]);

  useEffect(() => {
    if (hotelLoading) return;
    fetchActionCounts();
  }, [hotelId, hotelLoading, fetchActionCounts]);

  useEffect(() => {
    if (hotelLoading || viewMode !== 'action') return;
    setLoading(true);
    const timer = setTimeout(() => {
      fetchActionBookings(actionPage).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [viewMode, fetchActionBookings, actionPage, actionFilterKey, hotelLoading]);

  useEffect(() => {
    if (hotelLoading || viewMode !== 'all') return;
    const timer = setTimeout(() => fetchAllBookings(allPage), 300);
    return () => clearTimeout(timer);
  }, [viewMode, fetchAllBookings, allPage, allFilterKey, hotelLoading]);

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

  const actionCounts = useMemo(
    () => getStaffActionCounts(actionCountBookings),
    [actionCountBookings]
  );

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
    setLateCheckoutFeeAmount('');
    setLateCheckoutFeeNote('');
    setLateCheckoutOfflineConfirmed(false);
    setShowCheckOutModal(true);
  };

  const closeModals = () => {
    setShowCheckInModal(false);
    setShowCheckOutModal(false);
    setSelectedBooking(null);
    setLateCheckoutFeeAmount('');
    setLateCheckoutFeeNote('');
    setLateCheckoutOfflineConfirmed(false);
  };

  const handleCheckIn = async () => {
    if (!selectedBooking) return;

    try {
      setProcessing(true);
      await api.staffBooking.checkIn(selectedBooking._id);
      await reloadBookings();
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
      const payload = isOverstayCheckout(selectedBooking)
        ? {
            lateCheckoutFeeAmount: Number(String(lateCheckoutFeeAmount).replace(/[^\d]/g, '')),
            lateCheckoutFeeNote: lateCheckoutFeeNote.trim() || undefined,
          }
        : undefined;
      await api.staffBooking.checkOut(selectedBooking._id, payload);
      await reloadBookings();
      closeModals();
      toast.success('Check-out thành công');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Có lỗi xảy ra khi check-out'));
    } finally {
      setProcessing(false);
    }
  };

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

  const closeProofPreview = useCallback(() => {
    setPreviewProofUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const handlePreviewProof = useCallback(async (booking, kind, mediaRef) => {
    try {
      const url = await resolveProofPreviewUrl({
        roleScope: 'staff',
        bookingId: booking?._id,
        kind,
        mediaRef,
      });
      setPreviewProofUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Không thể tải ảnh minh chứng'));
    }
  }, []);

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
    actionPagination: {
      page: actionPagination.page,
      totalPages: actionPagination.totalPages,
      total: actionPagination.total,
      setPage: setActionPage,
    },
    filteredBookings: listBookings,
    allPagination: {
      page: allPagination.page,
      totalPages: allPagination.totalPages,
      total: allPagination.total,
      setPage: setAllPage,
    },
    emptyMessage,
    previewProofUrl,
    handlePreviewProof,
    closeProofPreview,
    showCheckInModal,
    showCheckOutModal,
    showDetailModal,
    selectedBooking,
    processing,
    detailLoading,
    detailBooking,
    lateCheckoutFeeAmount,
    lateCheckoutFeeNote,
    lateCheckoutOfflineConfirmed,
    setLateCheckoutFeeAmount,
    setLateCheckoutFeeNote,
    setLateCheckoutOfflineConfirmed,
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
