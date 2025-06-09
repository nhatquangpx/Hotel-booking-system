import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconButton, Tooltip, Button, Paper, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import api from '../../../apis';
import AdminLayout from '../../../components/Admin/AdminLayout';
import './UserList.scss';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.adminUser.getAllUsers();
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
      await api.adminUser.deleteUser(userToDelete._id);
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
    const matchesName = user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmail = user.email?.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesPhone = user.phone?.includes(searchPhone);
    return matchesName && matchesEmail && matchesPhone;
  });

  return (
    <AdminLayout>
      <h1>Danh sách người dùng</h1>
      <div className="user-list-container">
        <Paper className="search-bar" sx={{ background: 'var(--admin-sidebar)' }}>
          <div className="search-bar-row">
            <div className="search-bar-inputs">
              <TextField
                label="Tìm theo tên"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
              <TextField
                label="Email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                size="small"
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
              <TextField
                label="Số điện thoại"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                size="small"
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
            </div>
            <Link to="/admin/users/create" className="add-user-btn-link" style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                sx={{ 
                  backgroundColor: 'var(--admin-primary)',
                  '&:hover': { backgroundColor: 'var(--admin-primary)', opacity: 0.8 }
                }}
              >
                Thêm người dùng
              </Button>
            </Link>
          </div>
        </Paper>

        {error && <div className="error-message">{error}</div>}
        
        <div className="user-table">
          <table>
            <thead>
              <tr>
                <th>Tên người dùng</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="loading">Đang tải...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">Không tìm thấy người dùng nào</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td className="user-name">
                      {user.name}
                    </td>
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
                        {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Tooltip title="Xem chi tiết">
                          <Link to={`/admin/users/${user._id}`}>
                            <IconButton size="small" color="primary">
                              <VisibilityIcon />
                            </IconButton>
                          </Link>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <Link to={`/admin/users/edit/${user._id}`}>
                            <IconButton size="small" color="primary">
                              <EditIcon />
                            </IconButton>
                          </Link>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <DeleteIcon />
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

        {showDeleteModal && (
          <div className="delete-modal">
            <div className="modal-content">
              <div className="modal-title">Xác nhận xóa</div>
              <p>Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete?.name}</strong>?</p>
              <p>Hành động này không thể hoàn tác.</p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={handleCancelDelete}>Hủy</button>
                <button className="delete-btn" onClick={handleConfirmDelete}>Xác nhận xóa</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserList; 