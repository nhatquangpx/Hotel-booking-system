import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconButton, Tooltip, Paper, TextField, MenuItem } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import api from '@/apis';
import { AdminLayout } from '@/features/admin/components';
import { formatDate } from '@/shared/utils';
import './BookingList.scss';

/**
 * Admin Booking List page feature
 * List and manage bookings for admin
 */
const AdminBookingListPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hotels, setHotels] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [bookingToUpdate, setBookingToUpdate] = useState(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState('');

  useEffect(() => {
    fetchBookings();
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const response = await api.adminHotel.getAllHotels();
      setHotels(response);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách khách sạn');
    }
  };

  const fetchBookings = async () => {
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
  };

  // Lọc booking theo tên khách, email, mã đặt phòng, khách sạn và khoảng thời gian
  const filteredBookings = bookings.filter(booking => {
    const guestName = booking.guest?.name || booking.userName || '';
    const guestEmail = booking.guest?.email || booking.userEmail || '';
    const code = booking._id || '';
    const hotelId = booking.hotel?._id || '';
    const checkIn = new Date(booking.checkInDate || booking.checkIn);
    const checkOut = new Date(booking.checkOutDate || booking.checkOut);
    
    const matchesSearch = guestName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      guestEmail.toLowerCase().includes(searchEmail.toLowerCase()) &&
      code.toLowerCase().includes(searchCode.toLowerCase());
    
    const matchesHotel = !selectedHotel || hotelId === selectedHotel;
    
    const matchesDateRange = (!startDate || checkIn >= new Date(startDate)) &&
      (!endDate || checkOut <= new Date(endDate));
    
    return matchesSearch && matchesHotel && matchesDateRange;
  });


  const handleEditPaymentStatus = (booking) => {
    setBookingToUpdate(booking);
    setNewPaymentStatus(booking.paymentStatus);
    setShowUpdateModal(true);
  };

  const handleConfirmUpdate = async () => {
    if (!bookingToUpdate) return;
    try {
      await api.adminBooking.updateBookingStatus(bookingToUpdate._id, newPaymentStatus);
      setBookings(bookings.map(b => b._id === bookingToUpdate._id ? { ...b, paymentStatus: newPaymentStatus } : b));
      setShowUpdateModal(false);
      setBookingToUpdate(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật trạng thái thanh toán');
    }
  };

  const handleCancelUpdate = () => {
    setShowUpdateModal(false);
    setBookingToUpdate(null);
  };

  return (
    <AdminLayout>
      <div className="booking-list-container">
        <Paper className="search-bar" sx={{ background: 'var(--admin-sidebar)' }}>
          <div className="search-bar-row">
            <div className="search-bar-inputs">
              <TextField
                label="Tìm theo tên khách"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
              <TextField
                label="Email khách"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                size="small"
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
              <TextField
                label="Mã đặt phòng"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                size="small"
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
              <TextField
                select
                label="Khách sạn"
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
                size="small"
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              >
                <MenuItem value="">Tất cả khách sạn</MenuItem>
                {hotels.map((hotel) => (
                  <MenuItem key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Từ ngày"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                InputLabelProps={{ 
                  style: { color: 'var(--admin-text)' },
                  shrink: true 
                }}
                InputProps={{ 
                  style: { color: 'var(--admin-text)' },
                  sx: { '&::-webkit-calendar-picker-indicator': { color: 'var(--admin-text)' } }
                }}
              />
              <TextField
                label="Đến ngày"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                InputLabelProps={{ 
                  style: { color: 'var(--admin-text)' },
                  shrink: true 
                }}
                InputProps={{ 
                  style: { color: 'var(--admin-text)' },
                  sx: { '&::-webkit-calendar-picker-indicator': { color: 'var(--admin-text)' } }
                }}
              />
            </div>
          </div>
        </Paper>

        {error && <div className="error-message">{error}</div>}

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
                  <td colSpan="10" className="loading">Đang tải...</td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center">Không tìm thấy đơn đặt phòng nào</td>
                </tr>
              ) : (
                filteredBookings.map(booking => (
                  <tr key={booking._id}>
                    <td>{booking._id.slice(-6).toUpperCase()}</td>
                    <td>{booking.guest?.name || booking.userName || 'N/A'}</td>
                    <td>{booking.guest?.email || booking.userEmail || 'N/A'}</td>
                    <td>{booking.hotel?.name || booking.hotelName || 'N/A'}</td>
                    <td>{booking.room?.roomNumber || booking.roomName || 'N/A'}</td>
                    <td>{formatDate(booking.checkInDate || booking.checkIn)}</td>
                    <td>{formatDate(booking.checkOutDate || booking.checkOut)}</td>
                    <td>{typeof booking.totalAmount === 'number' ? booking.totalAmount.toLocaleString('vi-VN') + ' VND' : 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${booking.paymentStatus}`}>
                        {booking.paymentStatus === 'pending' && 'Chưa thanh toán'}
                        {booking.paymentStatus === 'paid' && 'Đã thanh toán'}
                        {booking.paymentStatus === 'cancelled' && 'Đã hủy'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Tooltip title="Xem chi tiết">
                          <Link to={`/admin/bookings/${booking._id}`}>
                            <IconButton size="small" color="primary">
                              <VisibilityIcon />
                            </IconButton>
                          </Link>
                        </Tooltip>
                        <Tooltip title="Cập nhật trạng thái thanh toán">
                          <IconButton size="small" color="secondary" onClick={() => handleEditPaymentStatus(booking)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {showUpdateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Cập nhật trạng thái thanh toán</h2>
                <button className="close-button" onClick={handleCancelUpdate}>&times;</button>
              </div>
              <div className="modal-body">
                <p>
                  Đơn đặt phòng #{bookingToUpdate?._id.slice(-6).toUpperCase()} - {bookingToUpdate?.guest?.name || bookingToUpdate?.userName}
                </p>
                <div className="form-group">
                  <label htmlFor="paymentStatus">Trạng thái thanh toán</label>
                  <select
                    id="paymentStatus"
                    value={newPaymentStatus}
                    onChange={e => setNewPaymentStatus(e.target.value)}
                    required
                  >
                    <option value="pending">Chưa thanh toán</option>
                    <option value="paid">Đã thanh toán</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button className="submit-btn" onClick={handleConfirmUpdate}>Cập nhật</button>
                  <button className="cancel-btn" onClick={handleCancelUpdate}>Hủy</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBookingListPage; 