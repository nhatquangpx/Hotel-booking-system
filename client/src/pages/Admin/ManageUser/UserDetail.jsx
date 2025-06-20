import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../../apis';
import AdminLayout from '../../../components/Admin/AdminLayout';
import './UserDetail.scss';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await api.adminUser.getUserById(id);
        setUser(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };

    const fetchBookings = async () => {
      const data = await api.adminBooking.getUserBookings(id);
      setBookings(data);
    };

    fetchUser();
    fetchBookings();
  }, [id]);

  if (loading) return (
    <AdminLayout>
      <div className="loading">Đang tải...</div>
    </AdminLayout>
  );
  
  if (error) return (
    <AdminLayout>
      <div className="error-message">{error}</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="user-detail-container">
        <h1>Chi tiết người dùng</h1>
        
        <div className="detail-card">
          <div className="detail-header">
            <h3>{user.name}</h3>
            <div className="detail-actions">
              <Tooltip title="Chỉnh sửa">
                <IconButton 
                  color="primary"
                  onClick={() => navigate(`/admin/users/edit/${id}`)}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Quay lại">
                <IconButton 
                  color="primary"
                  onClick={() => navigate('/admin/users')}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          
          <div className="detail-body">
            <div className="detail-row">
              <div className="detail-label">Email:</div>
              <div className="detail-value">{user.email}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Số điện thoại:</div>
              <div className="detail-value">{user.phone}</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Vai trò:</div>
              <div className="detail-value">
                {user.role === 'admin' ? 'Quản trị viên' : 
                 user.role === 'owner' ? 'Chủ khách sạn' : 'Khách'}
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Ngày tạo:</div>
              <div className="detail-value">
                {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Lần cập nhật cuối:</div>
              <div className="detail-value">
                {new Date(user.updatedAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
        
        {user.role === 'guest' && (
          <>
            <div className="section-title">
              <h3>Lịch sử đặt phòng</h3>
            </div>
            
            {bookings && bookings.length > 0 ? (
              <div className="booking-table">
                <table>
                  <thead>
                    <tr>
                      <th>Mã đặt phòng</th>
                      <th>Khách sạn</th>
                      <th>Phòng</th>
                      <th>Ngày nhận phòng</th>
                      <th>Ngày trả phòng</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => (
                      <tr key={booking._id}>
                        <td>{booking._id}</td>
                        <td>{booking.hotelId ? (
                          <Link to={`/admin/hotels/${booking.hotelId}`}>{booking.hotelName || booking.hotelId}</Link>
                        ) : (booking.hotelName || 'N/A')}</td>
                        <td>{booking.roomId ? (
                          <Link to={`/admin/rooms/${booking.roomId}`}>{booking.roomNumber || booking.roomId}</Link>
                        ) : (booking.roomNumber || 'N/A')}</td>
                        <td>{booking.checkIn ? new Date(booking.checkIn).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{booking.checkOut ? new Date(booking.checkOut).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>
                          {booking.status === 'pending' && (
                            <span className="status-badge pending">Chưa thanh toán</span>
                          )}
                          {booking.status === 'paid' && (
                            <span className="status-badge paid">Đã thanh toán</span>
                          )}
                          {booking.status === 'cancelled' && (
                            <span className="status-badge cancelled">Đã hủy</span>
                          )}
                          {booking.status === 'refunded' && (
                            <span className="status-badge refunded">Đã hoàn tiền</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-bookings">
                Người dùng chưa có lịch sử đặt phòng nào.
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserDetail; 