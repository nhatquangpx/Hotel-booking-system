import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, deleteUser } from '../../services/userService';
import './AdminComponents.scss';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete._id);
      setUsers(users.filter(user => user._id !== userToDelete._id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi xóa người dùng');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <div className="action-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, hoặc số điện thoại"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link to="/admin/users/create">
          <button className="add-button">Thêm người dùng</button>
        </Link>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Số điện thoại</th>
            <th>Vai trò</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>Không tìm thấy người dùng nào</td>
            </tr>
          ) : (
            filteredUsers.map(user => (
              <tr key={user._id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>
                  {user.role === 'admin' ? 'Quản trị viên' : 
                   user.role === 'staff' ? 'Nhân viên' : 'Người dùng'}
                </td>
                <td className="action-buttons">
                  <Link to={`/admin/users/${user._id}`}>
                    <button className="view-btn">Xem</button>
                  </Link>
                  <Link to={`/admin/users/edit/${user._id}`}>
                    <button className="edit-btn">Sửa</button>
                  </Link>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteClick(user)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
              <button className="close-button" onClick={handleCancelDelete}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete?.fullName}</strong>?</p>
              <p>Hành động này không thể hoàn tác.</p>
              <div className="form-actions">
                <button className="cancel-btn" onClick={handleCancelDelete}>Hủy</button>
                <button className="submit-btn" onClick={handleConfirmDelete}>Xác nhận xóa</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList; 