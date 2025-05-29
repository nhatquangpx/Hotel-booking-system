import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { bookingAPI } from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [bookingToUpdate, setBookingToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingAPI.getAllBookings();
      setBookings(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = (booking) => {
    setBookingToUpdate(booking);
    setNewStatus(booking.status);
    setShowUpdateModal(true);
  };

  const handleConfirmUpdate = async () => {
    if (!bookingToUpdate) return;
    
    try {
      await bookingAPI.updateBookingStatus(bookingToUpdate._id, { status: newStatus });
      
      setBookings(bookings.map(booking => 
        booking._id === bookingToUpdate._id 
          ? { ...booking, status: newStatus } 
          : booking
      ));
      
      setShowUpdateModal(false);
      setBookingToUpdate(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật trạng thái đặt phòng');
    }
  };

  const handleCancelUpdate = () => {
    setShowUpdateModal(false);
    setBookingToUpdate(null);
  };

  // Lọc đặt phòng dựa theo tìm kiếm và bộ lọc
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking._id?.includes(searchTerm) ||
      booking.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.roomName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatusFilter = filterStatus ? booking.status === filterStatus : true;
    
    return matchesSearch && matchesStatusFilter;
  });

  // Format ngày tháng
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  if (loading) return (
    <AdminLayout>
      <div>Đang tải...</div>
    </AdminLayout>
  );
  
  if (error) return (
    <AdminLayout>
      <div className="error-message">{error}</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div>
        <div className="action-bar">
          <div className="search-filter-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Tìm kiếm theo mã đặt phòng, khách sạn, tên khách hàng"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-box">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="cancelled">Đã hủy</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đặt phòng</th>
              <th>Khách hàng</th>
              <th>Khách sạn</th>
              <th>Phòng</th>
              <th>Nhận phòng</th>
              <th>Trả phòng</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center' }}>Không tìm thấy đơn đặt phòng nào</td>
              </tr>
            ) : (
              filteredBookings.map(booking => (
                <tr key={booking._id}>
                  <td>{booking._id.slice(-6).toUpperCase()}</td>
                  <td>{booking.userName}</td>
                  <td>{booking.hotelName}</td>
                  <td>{booking.roomName}</td>
                  <td>{formatDate(booking.checkIn)}</td>
                  <td>{formatDate(booking.checkOut)}</td>
                  <td>{booking.totalPrice.toLocaleString('vi-VN')} VND</td>
                  <td>
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status === 'pending' && 'Chờ xác nhận'}
                      {booking.status === 'confirmed' && 'Đã xác nhận'}
                      {booking.status === 'cancelled' && 'Đã hủy'}
                      {booking.status === 'completed' && 'Hoàn thành'}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <Link to={`/admin/bookings/${booking._id}`}>
                      <button className="view-btn">Xem</button>
                    </Link>
                    <button 
                      className="edit-btn"
                      onClick={() => handleUpdateClick(booking)}
                    >
                      Cập nhật
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {showUpdateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Cập nhật trạng thái đặt phòng</h2>
                <button className="close-button" onClick={handleCancelUpdate}>&times;</button>
              </div>
              <div className="modal-body">
                <p>
                  Cập nhật trạng thái cho đơn đặt phòng #{bookingToUpdate?._id.slice(-6).toUpperCase()} - 
                  {bookingToUpdate?.hotelName} ({formatDate(bookingToUpdate?.checkIn)} - {formatDate(bookingToUpdate?.checkOut)})
                </p>
                
                <div className="form-group">
                  <label htmlFor="status">Trạng thái mới</label>
                  <select
                    id="status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  >
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="cancelled">Đã hủy</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button className="cancel-btn" onClick={handleCancelUpdate}>Hủy</button>
                  <button className="submit-btn" onClick={handleConfirmUpdate}>Cập nhật</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BookingList; 