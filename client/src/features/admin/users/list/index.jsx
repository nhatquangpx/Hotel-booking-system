import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { Button, Paper, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { AdminLayout, ConfirmDeleteDialog } from '@/features/admin/components';
import Pagination from '@/shared/components/Pagination/Pagination';
import { PAGE_SIZE } from '@/constants/pagination';
import UserFormDialog from '../components/UserFormDialog';
import UserDetailDialog from '../components/UserDetailDialog';
import UserTable from './components/UserTable';
import UserListByRole from './components/UserListByRole';
import UserListByHotel from './components/UserListByHotel';
import ViewModeSelector from './components/ViewModeSelector';
import api from '../../../../apis';
import { apiErrorMessage } from '@/shared/utils';
import {
  VIEW_MODES,
  groupUsersByRole,
} from './utils/userListHelpers';
import './UserList.scss';
/**
 * Admin User List page feature
 * List and manage users for admin
 */
const AdminUserListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [hotelGroups, setHotelGroups] = useState([]);
  const [hotelViewExtra, setHotelViewExtra] = useState({
    orphanStaff: [],
    orphanOwners: [],
    separateRoleGroups: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE.ADMIN_USERS,
    total: 0,
    totalPages: 1,
  });
  const resetPageOnFetch = useRef(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUserId, setViewingUserId] = useState(null);

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId) {
      setViewingUserId(userId);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const searchKey = `${searchTerm}|${searchEmail}|${searchPhone}|${viewMode}`;

  useEffect(() => {
    setPage(1);
    resetPageOnFetch.current = true;
  }, [searchKey]);

  const fetchUsers = useCallback(async (targetPage = page) => {
    try {
      setLoading(true);
      const isHotelView = viewMode === VIEW_MODES.HOTEL;
      const isRoleView = viewMode === VIEW_MODES.ROLE;

      const params = {
        view: isHotelView ? 'hotel' : 'list',
        searchName: searchTerm,
        searchEmail,
        searchPhone,
      };

      if (isRoleView) {
        params.all = true;
      } else {
        params.page = targetPage;
        params.limit = isHotelView ? PAGE_SIZE.ADMIN_HOTEL_GROUPS : PAGE_SIZE.ADMIN_USERS;
      }

      const result = await api.adminUser.getAllUsers(params);

      if (isHotelView) {
        setHotelGroups(result.items || []);
        setHotelViewExtra(result.extra || {});
        setUsers([]);
      } else {
        setUsers(result.items || []);
        setHotelGroups([]);
      }
      setPagination(result.pagination);
      if (!isRoleView) {
        setPage(targetPage);
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách người dùng');
    } finally {
      setLoading(false);
      resetPageOnFetch.current = false;
    }
  }, [page, viewMode, searchTerm, searchEmail, searchPhone]);

  useEffect(() => {
    const targetPage = resetPageOnFetch.current ? 1 : page;
    const timer = setTimeout(() => {
      fetchUsers(targetPage);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers, page, searchKey]);

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete || deletingUser) return;

    try {
      setDeletingUser(true);
      await api.adminUser.deleteUser(userToDelete._id);
      await fetchUsers(page);
      setShowDeleteModal(false);
      setUserToDelete(null);
      toast.success('Xóa người dùng thành công');
    } catch (err) {
      const msg = apiErrorMessage(err, 'Có lỗi xảy ra khi xóa người dùng');
      setError(msg);
      toast.error(msg);
    } finally {
      setDeletingUser(false);
    }
  };

  const handleCancelDelete = () => {
    if (deletingUser) return;
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

  const handleOpenViewDialog = (user) => {
    setViewingUserId(user._id);
  };

  const handleCloseViewDialog = () => {
    setViewingUserId(null);
  };

  const handleEditFromDetail = (user) => {
    handleOpenEditDialog(user);
  };

  const handleCloseUserDialog = () => {
    setShowUserDialog(false);
    setEditingUser(null);
  };

  const handleUserSuccess = () => {
    fetchUsers(page);
  };

  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
  };

  const roleGroups = useMemo(() => groupUsersByRole(users), [users]);

  const renderUserList = () => {
    if (viewMode === VIEW_MODES.ROLE) {
      return (
        <UserListByRole
          roleGroups={roleGroups}
          loading={loading}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteClick}
          onView={handleOpenViewDialog}
        />
      );
    }

    if (viewMode === VIEW_MODES.HOTEL) {
      return (
        <UserListByHotel
          hotelGroups={hotelGroups}
          orphanStaff={hotelViewExtra.orphanStaff}
          orphanOwners={hotelViewExtra.orphanOwners}
          separateRoleGroups={hotelViewExtra.separateRoleGroups}
          loading={loading}
          hotelPagination={{
            page: pagination.page,
            totalPages: pagination.totalPages,
            total: pagination.total,
            pageSize: pagination.limit,
            onPageChange: setPage,
          }}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteClick}
          onView={handleOpenViewDialog}
        />
      );
    }

    return (
      <UserTable
        users={users}
        loading={loading}
        startIndex={(pagination.page - 1) * pagination.limit}
        onEdit={handleOpenEditDialog}
        onDelete={handleDeleteClick}
        onView={handleOpenViewDialog}
      />
    );
  };

  const paginationProps =
    viewMode === VIEW_MODES.LIST
      ? {
          page: pagination.page,
          totalPages: pagination.totalPages,
          total: pagination.total,
          pageSize: pagination.limit,
          onPageChange: setPage,
        }
      : null;

  return (
    <AdminLayout>
      <div className="user-list-container">
        <Paper className="search-bar" sx={{ background: 'var(--admin-sidebar)' }}>
          <div className="admin-search-toolbar">
            <div className="admin-search-toolbar__top">
              <span className="admin-search-toolbar__title">Tìm kiếm người dùng</span>
              <div className="admin-search-toolbar__actions">
                <Button
                  variant="contained"
                  color="primary"
                  className="admin-search-toolbar__btn"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateDialog}
                >
                  Thêm người dùng
                </Button>
                <span className="view-mode-label">Hiển thị</span>
                <ViewModeSelector value={viewMode} onChange={handleViewModeChange} />
              </div>
            </div>

            <div className="admin-search-toolbar__grid admin-search-toolbar__grid--user">
              <TextField
                label="Tên"
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
            </div>
          </div>
        </Paper>

        {error && <div className="error-message">{error}</div>}

        {renderUserList()}

        {paginationProps && (
          <Pagination {...paginationProps} variant="admin" className="admin-pagination" />
        )}

        <ConfirmDeleteDialog
          isOpen={showDeleteModal}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          confirming={deletingUser}
          message={
            <>
              Bạn có chắc chắn muốn xóa người dùng <strong>{userToDelete?.name}</strong>?
            </>
          }
        />

        <UserFormDialog
          isOpen={showUserDialog}
          onClose={handleCloseUserDialog}
          userId={editingUser?._id || null}
          onSuccess={handleUserSuccess}
        />

        <UserDetailDialog
          isOpen={!!viewingUserId}
          onClose={handleCloseViewDialog}
          userId={viewingUserId}
          onEdit={handleEditFromDetail}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUserListPage;
