import React, { useState, useEffect, useMemo } from 'react';
import { Button, Paper, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { AdminLayout } from '@/features/admin/components';
import UserFormDialog from '../components/UserFormDialog';
import UserTable from './components/UserTable';
import UserListByRole from './components/UserListByRole';
import UserListByHotel from './components/UserListByHotel';
import ViewModeSelector from './components/ViewModeSelector';
import api from '../../../../apis';
import {
  VIEW_MODES,
  filterUsers,
  groupUsersByRole,
  buildHotelViewData,
} from './utils/userListHelpers';
import './UserList.scss';

/**
 * Admin User List page feature
 * List and manage users for admin
 */
const AdminUserListPage = () => {
  const [users, setUsers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchHotels();
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

  const fetchHotels = async () => {
    try {
      const data = await api.adminHotel.getAllHotels();
      setHotels(data);
    } catch {
      // Không chặn trang nếu tải KS thất bại; chế độ theo KS sẽ trống
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
      setUsers((prev) => prev.filter((user) => user._id !== userToDelete._id));
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

  const handleOpenCreateDialog = () => {
    setEditingUser(null);
    setShowUserDialog(true);
  };

  const handleOpenEditDialog = (user) => {
    setEditingUser(user);
    setShowUserDialog(true);
  };

  const handleCloseUserDialog = () => {
    setShowUserDialog(false);
    setEditingUser(null);
  };

  const handleUserSuccess = () => {
    fetchUsers();
    if (viewMode === VIEW_MODES.HOTEL) {
      fetchHotels();
    }
  };

  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
  };

  const filteredUsers = useMemo(
    () =>
      filterUsers(users, {
        searchTerm,
        searchEmail,
        searchPhone,
        selectedRole,
      }),
    [users, searchTerm, searchEmail, searchPhone, selectedRole]
  );

  const roleGroups = useMemo(
    () => groupUsersByRole(filteredUsers),
    [filteredUsers]
  );

  const hotelViewData = useMemo(
    () => buildHotelViewData(hotels, filteredUsers, users),
    [hotels, filteredUsers, users]
  );

  const renderUserList = () => {
    if (viewMode === VIEW_MODES.ROLE) {
      return (
        <UserListByRole
          roleGroups={roleGroups}
          loading={loading}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteClick}
        />
      );
    }

    if (viewMode === VIEW_MODES.HOTEL) {
      return (
        <UserListByHotel
          hotelGroups={hotelViewData.hotelGroups}
          orphanStaff={hotelViewData.orphanStaff}
          orphanOwners={hotelViewData.orphanOwners}
          separateRoleGroups={hotelViewData.separateRoleGroups}
          loading={loading}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteClick}
        />
      );
    }

    return (
      <UserTable
        users={filteredUsers}
        loading={loading}
        onEdit={handleOpenEditDialog}
        onDelete={handleDeleteClick}
      />
    );
  };

  return (
    <AdminLayout>
      <div className="user-list-container">
        <Paper className="search-bar" sx={{ background: 'var(--admin-sidebar)' }}>
          <div className="search-filters-row">
            <div className="search-bar-inputs">
              <TextField
                label="Tìm theo tên"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
              <TextField
                label="Email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
              <TextField
                label="Số điện thoại"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
              <TextField
                select
                label="Vai trò"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                size="small"
                fullWidth
                SelectProps={{ native: true }}
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              >
                <option value="all">Tất cả</option>
                <option value="admin">Quản trị viên</option>
                <option value="owner">Chủ khách sạn</option>
                <option value="staff">Nhân viên</option>
                <option value="guest">Khách</option>
              </TextField>
            </div>
            <div className="add-user-btn-link" onClick={handleOpenCreateDialog}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                sx={{
                  backgroundColor: 'var(--admin-primary)',
                  '&:hover': {
                    backgroundColor: 'var(--admin-primary)',
                    opacity: 0.8,
                  },
                  cursor: 'pointer',
                }}
              >
                Thêm người dùng
              </Button>
            </div>
          </div>

          <div className="view-mode-row">
            <span className="view-mode-label">Hiển thị</span>
            <ViewModeSelector value={viewMode} onChange={handleViewModeChange} />
          </div>
        </Paper>

        {error && <div className="error-message">{error}</div>}

        {renderUserList()}

        {showDeleteModal && (
          <div className="delete-modal">
            <div className="modal-content">
              <div className="modal-title">Xác nhận xóa</div>
              <p>
                Bạn có chắc chắn muốn xóa người dùng{' '}
                <strong>{userToDelete?.name}</strong>?
              </p>
              <p>Hành động này không thể hoàn tác.</p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={handleCancelDelete}>
                  Hủy
                </button>
                <button className="delete-btn" onClick={handleConfirmDelete}>
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        )}

        <UserFormDialog
          isOpen={showUserDialog}
          onClose={handleCloseUserDialog}
          userId={editingUser?._id || null}
          onSuccess={handleUserSuccess}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUserListPage;
