import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@/components/ui/Dialog';
import api from '../../../../apis';
import './UserDetailDialog.scss';

const getRoleLabel = (role) => {
  switch (role) {
    case 'admin': return 'Quản trị viên';
    case 'owner': return 'Chủ khách sạn';
    case 'staff': return 'Nhân viên khách sạn';
    default: return 'Khách';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending': return 'Chưa thanh toán';
    case 'paid': return 'Đã thanh toán';
    case 'cancelled': return 'Đã hủy';
    case 'refunded': return 'Đã hoàn tiền';
    default: return status;
  }
};

const UserDetailDialog = ({ isOpen, onClose, userId, onEdit }) => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !userId) {
      setUser(null);
      setBookings([]);
      setError(null);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await api.adminUser.getUserById(userId);
        setUser(userData);

        if (userData.role === 'guest') {
          try {
            const bookingData = await api.adminBooking.getUserBookings(userId);
            setBookings(Array.isArray(bookingData) ? bookingData : []);
          } catch (bookingErr) {
            setBookings([]);
            console.error('Không tải được lịch sử đặt phòng:', bookingErr);
          }
        } else {
          setBookings([]);
        }
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, userId]);

  const handleEdit = () => {
    onEdit?.(user);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết người dùng"
      maxWidth="900px"
      className="user-detail-dialog"
    >
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : user ? (
        <div className="user-detail-content">
          <div className="detail-header">
            <h3>{user.name}</h3>
            <Tooltip title="Chỉnh sửa">
              <IconButton color="primary" onClick={handleEdit} size="small">
                <EditIcon />
              </IconButton>
            </Tooltip>
          </div>

          <div className="detail-body">
            <div className="detail-row">
              <div className="detail-label">Email:</div>
              <div className="detail-value">{user.email}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Số điện thoại:</div>
              <div className="detail-value">{user.phone || 'Chưa cập nhật'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Vai trò:</div>
              <div className="detail-value">{getRoleLabel(user.role)}</div>
            </div>
            {user.role === 'staff' && (
              <div className="detail-row">
                <div className="detail-label">Khách sạn làm việc:</div>
                <div className="detail-value">{user.assignedHotelId?.name || 'Chưa gán'}</div>
              </div>
            )}
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

          {user.role === 'guest' && (
            <div className="booking-section">
              <h4>Lịch sử đặt phòng</h4>
              {bookings.length > 0 ? (
                <div className="booking-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Mã đặt phòng</th>
                        <th>Khách sạn</th>
                        <th>Phòng</th>
                        <th>Nhận phòng</th>
                        <th>Trả phòng</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking._id}>
                          <td>{booking._id.slice(-6).toUpperCase()}</td>
                          <td>{booking.hotelName || 'N/A'}</td>
                          <td>{booking.roomNumber || 'N/A'}</td>
                          <td>
                            {booking.checkIn
                              ? new Date(booking.checkIn).toLocaleDateString('vi-VN')
                              : 'N/A'}
                          </td>
                          <td>
                            {booking.checkOut
                              ? new Date(booking.checkOut).toLocaleDateString('vi-VN')
                              : 'N/A'}
                          </td>
                          <td>
                            <span className={`status-badge ${booking.status}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-bookings">Người dùng chưa có lịch sử đặt phòng nào.</p>
              )}
            </div>
          )}
        </div>
      ) : null}
    </Dialog>
  );
};

export default UserDetailDialog;
