import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IconButton, Tooltip, Paper, TextField } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '@/apis';
import { AdminLayout } from '@/features/admin/components';
import BookingDetailDialog from '../components/BookingDetailDialog';
import BookingViewModeSelector from './components/BookingViewModeSelector';
import BookingListByHotel from './components/BookingListByHotel';
import BookingRevenueReportExport from './components/BookingRevenueReportExport';
import { formatDate } from '@/shared/utils';
import {
  filterAdminBookings,
  groupBookingsByHotel,
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
      const response = await api.adminHotel.getAllHotels();
      setHotels(response);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách khách sạn');
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.adminBooking.getAllBookings();
      setBookings(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách đặt phòng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = useMemo(
    () =>
      filterAdminBookings(bookings, {
        searchTerm,
        searchEmail,
        searchPhone,
        searchCode,
        searchHotelName,
        startDate,
        endDate,
      }),
    [
      bookings,
      searchTerm,
      searchEmail,
      searchPhone,
      searchCode,
      searchHotelName,
      startDate,
      endDate,
    ]
  );

  const hotelGroups = useMemo(
    () => groupBookingsByHotel(filteredBookings, hotels),
    [filteredBookings, hotels]
  );

  const paidBookingStats = useMemo(() => {
    const paid = filteredBookings.filter((b) => b.paymentStatus === 'paid');
    const sum = paid.reduce((acc, b) => acc + (Number(b.finalAmount) || 0), 0);
    return { count: paid.length, sum };
  }, [filteredBookings]);

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

        {!loading && bookings.length > 0 && (
          <div className="admin-booking-readonly-summary admin-summary-card">
            <strong>Tổng quan thanh toán</strong>
            <span>
              Hiển thị <strong>{filteredBookings.length}</strong> / {bookings.length} đơn
              {' '}
              — Đã thanh toán: <strong>{paidBookingStats.count}</strong> — Tổng tiền:{' '}
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
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center">
                      Không tìm thấy đơn đặt phòng nào
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
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
