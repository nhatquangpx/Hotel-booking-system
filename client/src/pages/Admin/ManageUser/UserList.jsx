import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminUserAPI } from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';
import AdminLayout from '../../../components/Admin/AdminLayout';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUserAPI.getAllUsers();
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
      await adminUserAPI.deleteUser(userToDelete._id);
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

  const handleRoleFilter = (e) => {
    setSelectedRole(e.target.value);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const content = () => {
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
          <div className="role-filter">
            <select value={selectedRole} onChange={handleRoleFilter}>
              <option value="all">Tất cả vai trò</option>
              <option value="user">Người dùng</option>
              <option value="staff">Nhân viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
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
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>Không tìm thấy người dùng nào</td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || 'Chưa cập nhật'}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === 'admin' ? 'Quản trị viên' : 
                       user.role === 'owner' ? 'Chủ khách sạn' : 'Khách'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status || 'active'}`}>
                      {user.status === 'active' ? 'Hoạt động' :
                       user.status === 'inactive' ? 'Không hoạt động' :
                       user.status === 'banned' ? 'Bị cấm' : 'Hoạt động'}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <Link to={`/admin/users/${user._id}`}>
                      <button className="view-btn">
                        <i className="fas fa-eye"></i>
                      </button>
                    </Link>
                    <Link to={`/admin/users/edit/${user._id}`}>
                      <button className="edit-btn">
                        <i className="fas fa-edit"></i>
                      </button>
                    </Link>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteClick(user)}
                    >
                      <i className="fas fa-trash"></i>
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
                <p>Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete?.name}</strong>?</p>
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

  return (
    <AdminLayout>
      {content()}
    </AdminLayout>
  );
};

export default UserList; 