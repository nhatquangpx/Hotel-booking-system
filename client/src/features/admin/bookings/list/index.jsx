import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IconButton, Tooltip, Paper, TextField } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '@/apis';
import { AdminLayout } from '@/features/admin/components';
import Pagination from '@/shared/components/Pagination/Pagination';
import { PAGE_SIZE } from '@/constants/pagination';
import BookingDetailDialog from '../components/BookingDetailDialog';
import BookingViewModeSelector from './components/BookingViewModeSelector';
import BookingListByHotel from './components/BookingListByHotel';
import BookingRevenueReportExport from './components/BookingRevenueReportExport';
import { formatDate } from '@/shared/utils';
import {
  VIEW_MODES,
} from './utils/bookingListHelpers';
import './BookingList.scss';

const textFieldSx = {
  InputLabelProps: { style: { color: 'var(--admin-text)' } },
  InputProps: { style: { color: 'var(--admin-text)' } },
};

const dateFieldSx = {
  InputLabelProps: {
    style: { color: 'var(--admin-text)' },
    shrink: true,
  },
  InputProps: {
    style: { color: 'var(--admin-text)' },
    sx: { '&::-webkit-calendar-picker-indicator': { color: 'var(--admin-text)' } },
  },
};

/**
 * Admin Booking List — chỉ xem danh sách & tổng thu (đơn đã thanh toán), không chỉnh trạng thái đơn.
 */
const AdminBookingListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [hotelGroups, setHotelGroups] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE.ADMIN_BOOKINGS,
    total: 0,
    totalPages: 1,
  });
  const resetPageOnFetch = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [searchHotelName, setSearchHotelName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [hotels, setHotels] = useState([]);
  const [viewingBookingId, setViewingBookingId] = useState(null);

  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    if (bookingId) {
      setViewingBookingId(bookingId);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchHotels = useCallback(async () => {
    try {
      const result = await api.adminHotel.getAllHotels({ all: true });
      setHotels(result.items || []);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách khách sạn');
    }
  }, []);

  const searchKey = `${searchTerm}|${searchEmail}|${searchPhone}|${searchCode}|${searchHotelName}|${startDate}|${endDate}|${viewMode}`;

  useEffect(() => {
    setPage(1);
    resetPageOnFetch.current = true;
  }, [searchKey]);

  const fetchBookings = useCallback(async (targetPage = page) => {
    try {
      setLoading(true);
      const isHotelView = viewMode === VIEW_MODES.HOTEL;
      const result = await api.adminBooking.getAllBookings({
        page: targetPage,
        limit: isHotelView ? PAGE_SIZE.ADMIN_HOTEL_GROUPS : PAGE_SIZE.ADMIN_BOOKINGS,
        view: isHotelView ? 'hotel' : 'list',
        searchTerm,
        searchEmail,
        searchPhone,
        searchCode,
        searchHotelName,
        startDate,
        endDate,
      });

      if (isHotelView) {
        setHotelGroups(result.items || []);
        setBookings([]);
      } else {
        setBookings(result.items || []);
        setHotelGroups([]);
      }
      setPagination(result.pagination);
      setPage(targetPage);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách đặt phòng');
    } finally {
      setLoading(false);
      resetPageOnFetch.current = false;
    }
  }, [
    page,
    viewMode,
    searchTerm,
    searchEmail,
    searchPhone,
    searchCode,
    searchHotelName,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  useEffect(() => {
    const targetPage = resetPageOnFetch.current ? 1 : page;
    const timer = setTimeout(() => {
      fetchBookings(targetPage);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchBookings, page, searchKey]);

  const paidBookingStats = useMemo(() => {
    const paid = bookings.filter((b) => b.paymentStatus === 'paid');
    const sum = paid.reduce((acc, b) => acc + (Number(b.finalAmount) || 0), 0);
    return { count: paid.length, sum };
  }, [bookings]);

  return (
    <AdminLayout>
      <div className="booking-list-container">
        <Paper className="search-bar" sx={{ background: 'var(--admin-sidebar)' }}>
          <div className="admin-search-toolbar">
            <div className="admin-search-toolbar__top">
              <span className="admin-search-toolbar__title">Tìm kiếm đơn đặt phòng</span>
              <div className="admin-search-toolbar__actions">
                <span className="view-mode-label">Hiển thị</span>
                <BookingViewModeSelector value={viewMode} onChange={setViewMode} />
              </div>
            </div>

            <div className="admin-search-toolbar__grid admin-search-toolbar__grid--guest">
              <TextField
                label="Tên khách"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                fullWidth
                {...textFieldSx}
              />
              <TextField
                label="Email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                size="small"
                fullWidth
                {...textFieldSx}
              />
              <TextField
                label="Số điện thoại"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                size="small"
                fullWidth
                {...textFieldSx}
              />
              <TextField
                label="Mã đặt phòng"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                size="small"
                fullWidth
                {...textFieldSx}
              />
            </div>

            <div className="admin-search-toolbar__grid admin-search-toolbar__grid--booking-extra">
              <TextField
                label="Tên khách sạn"
                value={searchHotelName}
                onChange={(e) => setSearchHotelName(e.target.value)}
                size="small"
                fullWidth
                {...textFieldSx}
              />
              <TextField
                label="Nhận phòng từ"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                fullWidth
                {...dateFieldSx}
              />
              <TextField
                label="Trả phòng đến"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                fullWidth
                {...dateFieldSx}
              />
            </div>
          </div>
        </Paper>

        <BookingRevenueReportExport hotels={hotels} />

        {!loading && pagination.total > 0 && (
          <div className="admin-booking-readonly-summary admin-summary-card">
            <strong>Tổng quan thanh toán (trang hiện tại)</strong>
            <span>
              Tổng <strong>{pagination.total}</strong> đơn khớp bộ lọc
              {' '}
              — Đã thanh toán trên trang này: <strong>{paidBookingStats.count}</strong> — Tổng tiền:{' '}
              <strong>{paidBookingStats.sum.toLocaleString('vi-VN')} VND</strong>
            </span>
            <span className="admin-booking-readonly-summary__hint">
              Admin chỉ xem; cập nhật trạng thái đơn do chủ khách sạn trên trang owner.
            </span>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {viewMode === VIEW_MODES.HOTEL ? (
          <BookingListByHotel
            hotelGroups={hotelGroups}
            loading={loading}
            onView={setViewingBookingId}
          />
        ) : (
          <div className="booking-table">
            <table>
              <thead>
                <tr>
                  <th>Mã đặt phòng</th>
                  <th>Khách hàng</th>
                  <th>Email</th>
                  <th>Khách sạn</th>
                  <th>Phòng</th>
                  <th>Nhận phòng</th>
                  <th>Trả phòng</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="loading">
                      Đang tải...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center">
                      Không tìm thấy đơn đặt phòng nào
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>{booking._id.slice(-6).toUpperCase()}</td>
                      <td>{booking.guest?.name || booking.userName || 'N/A'}</td>
                      <td>{booking.guest?.email || booking.userEmail || 'N/A'}</td>
                      <td>{booking.hotel?.name || booking.hotelName || 'N/A'}</td>
                      <td>{booking.room?.roomNumber || booking.roomName || 'N/A'}</td>
                      <td>{formatDate(booking.checkInDate || booking.checkIn)}</td>
                      <td>{formatDate(booking.checkOutDate || booking.checkOut)}</td>
                      <td>
                        {typeof booking.finalAmount === 'number'
                          ? `${booking.finalAmount.toLocaleString('vi-VN')} VND`
                          : 'N/A'}
                      </td>
                      <td>
                        <span className={`status-badge ${booking.paymentStatus}`}>
                          {booking.paymentStatus === 'pending' && 'Chưa thanh toán'}
                          {booking.paymentStatus === 'paid' && 'Đã thanh toán'}
                          {booking.paymentStatus === 'cancelled' && 'Đã hủy'}
                        </span>
                      </td>
                      <td>
                        <Tooltip title="Xem chi tiết (chỉ đọc)">
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label="Xem chi tiết"
                            onClick={() => setViewingBookingId(booking._id)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.limit}
          onPageChange={setPage}
          variant="admin"
          className="admin-pagination"
        />

        <BookingDetailDialog
          isOpen={!!viewingBookingId}
          onClose={() => setViewingBookingId(null)}
          bookingId={viewingBookingId}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminBookingListPage;
