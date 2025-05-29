import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { userAPI } from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await userAPI.getUserById(id);
        setUser(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

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
      <div className="admin-detail-container">
        <h2>Chi tiết người dùng</h2>
        
        <div className="detail-card">
          <div className="detail-header">
            <h3>{user.fullName}</h3>
            <div className="detail-actions">
              <button 
                onClick={() => navigate(`/admin/users/edit/${id}`)}
                className="edit-btn"
              >
                Sửa
              </button>
              <button 
                onClick={() => navigate('/admin/users')}
                className="back-btn"
              >
                Quay lại
              </button>
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
                 user.role === 'staff' ? 'Nhân viên' : 'Người dùng'}
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
        
        <div className="section-title">
          <h3>Lịch sử đặt phòng</h3>
        </div>
        
        {user.bookings && user.bookings.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đặt phòng</th>
                <th>Khách sạn</th>
                <th>Ngày nhận phòng</th>
                <th>Ngày trả phòng</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {user.bookings.map(booking => (
                <tr key={booking._id}>
                  <td>{booking._id}</td>
                  <td>{booking.hotelName}</td>
                  <td>{new Date(booking.checkIn).toLocaleDateString('vi-VN')}</td>
                  <td>{new Date(booking.checkOut).toLocaleDateString('vi-VN')}</td>
                  <td>{booking.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Người dùng chưa có lịch sử đặt phòng nào.</p>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserDetail; 