import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getRoleLabel } from '../utils/userListHelpers';

/** Cột dùng chung — độ rộng khai báo trong UserList.scss (CSS variables) */
const TABLE_COLUMNS = {
  standard: ['col-stt', 'col-name', 'col-email', 'col-phone', 'col-role', 'col-status', 'col-actions'],
  withPosition: ['col-stt', 'col-name', 'col-email', 'col-phone', 'col-position', 'col-status', 'col-actions'],
};

const UserTable = ({
  users,
  loading,
  emptyMessage = 'Không tìm thấy người dùng nào',
  showRoleColumn = true,
  showPositionColumn = false,
  startIndex = 0,
  getPositionLabel,
  onEdit,
  onDelete,
  onView,
}) => {
  const layoutKey = showPositionColumn ? 'withPosition' : 'standard';
  const columns = TABLE_COLUMNS[layoutKey];
  const colSpan = columns.length;

  return (
    <div className="user-table">
      <table className="user-table-fixed">
        <colgroup>
          {columns.map((className) => (
            <col key={className} className={className} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="col-stt">STT</th>
            <th className="col-name">Tên người dùng</th>
            <th className="col-email">Email</th>
            <th className="col-phone">Số điện thoại</th>
            {showPositionColumn && <th className="col-position">Vị trí</th>}
            {showRoleColumn && <th className="col-role">Vai trò</th>}
            <th className="col-status">Trạng thái</th>
            <th className="col-actions">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="loading">
                Đang tải...
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="text-center">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            users.map((user, index) => (
              <tr key={user._id}>
                <td className="col-stt">{startIndex + index + 1}</td>
                <td className="col-name user-name">
                  <span className="cell-ellipsis" title={user.name}>
                    {user.name}
                  </span>
                </td>
                <td className="col-email">
                  <span className="cell-ellipsis" title={user.email}>
                    {user.email}
                  </span>
                </td>
                <td className="col-phone">
                  <span className="cell-ellipsis" title={user.phone || undefined}>
                    {user.phone || 'Chưa cập nhật'}
                  </span>
                </td>
                {showPositionColumn && (
                  <td className="col-position">
                    <span className="position-badge">
                      {getPositionLabel?.(user) || '—'}
                    </span>
                  </td>
                )}
                {showRoleColumn && (
                  <td className="col-role">
                    <span className={`role-badge ${user.role}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                )}
                <td className="col-status">
                  <span className={`status-badge ${user.status || 'active'}`}>
                    {user.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td className="col-actions">
                  <div className="action-buttons">
                    <Tooltip title="Xem chi tiết">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onView?.(user)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton
                        size="small"
                        color="default"
                        sx={{ color: 'text.primary' }}
                        onClick={() => onEdit(user)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(user)}
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
  );
};

export default UserTable;
