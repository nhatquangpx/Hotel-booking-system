import React from 'react';
import UserTable from './UserTable';
import { ROLE_ORDER, getRoleLabel } from '../utils/userListHelpers';

const UserListByRole = ({
  roleGroups,
  loading,
  roles = ROLE_ORDER,
  onEdit,
  onDelete,
  onView,
}) => {
  if (loading) {
    return (
      <UserTable
        users={[]}
        loading
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    );
  }

  const nonEmptyRoles = roles.filter((role) => (roleGroups[role]?.length ?? 0) > 0);

  if (nonEmptyRoles.length === 0) {
    return (
      <div className="user-table">
        <p className="empty-groups-message">Không tìm thấy người dùng nào</p>
      </div>
    );
  }

  return (
    <div className="user-groups">
      {roles.map((role) => {
        const users = roleGroups[role] || [];
        if (!users.length && !loading) return null;

        return (
          <section key={role} className="user-group-section">
            <div className="user-group-header">
              <h2>{getRoleLabel(role)}</h2>
              <span className="user-group-count">{users.length} người dùng</span>
            </div>
            <UserTable
              users={users}
              loading={loading}
              emptyMessage="Không có người dùng trong nhóm này"
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          </section>
        );
      })}
    </div>
  );
};

export default UserListByRole;
