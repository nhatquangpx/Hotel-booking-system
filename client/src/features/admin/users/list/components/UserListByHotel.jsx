import React from 'react';
import UserTable from './UserTable';
import UserListByRole from './UserListByRole';
import { HOTEL_VIEW_SEPARATE_ROLES, getRoleLabel } from '../utils/userListHelpers';

const formatAddress = (address) => {
  if (!address) return '';
  if (typeof address !== 'object') return String(address);
  return [address.number, address.street, address.city].filter(Boolean).join(', ');
};

const UserListByHotel = ({
  hotelGroups,
  orphanStaff,
  orphanOwners,
  separateRoleGroups,
  loading,
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

  const hasHotelGroups = hotelGroups.length > 0;
  const hasOrphans = orphanStaff.length > 0 || orphanOwners.length > 0;
  const hasSeparateRoles = HOTEL_VIEW_SEPARATE_ROLES.some(
    (role) => (separateRoleGroups[role]?.length ?? 0) > 0
  );

  if (!loading && !hasHotelGroups && !hasOrphans && !hasSeparateRoles) {
    return (
      <div className="user-table">
        <p className="empty-groups-message">Không tìm thấy người dùng nào</p>
      </div>
    );
  }

  return (
    <div className="user-groups user-groups--hotel">
      {hotelGroups.map(({ hotel, owner, staff }) => {
        const teamUsers = [
          ...(owner ? [{ ...owner, _position: 'owner' }] : []),
          ...staff.map((s) => ({ ...s, _position: 'staff' })),
        ];

        return (
          <section key={hotel._id} className="user-group-section hotel-group-section">
            <div className="user-group-header hotel-group-header">
              <div className="hotel-group-title">
                <h2>{hotel.name}</h2>
                {formatAddress(hotel.address) && (
                  <p className="hotel-group-address">{formatAddress(hotel.address)}</p>
                )}
              </div>
              <span className="user-group-count">
                {teamUsers.length} thành viên
              </span>
            </div>
            <UserTable
              users={teamUsers}
              loading={loading}
              showRoleColumn={false}
              showPositionColumn
              getPositionLabel={(user) =>
                user._position === 'owner' ? 'Chủ khách sạn' : 'Nhân viên'
              }
              emptyMessage="Không có thành viên khớp bộ lọc"
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          </section>
        );
      })}

      {orphanOwners.length > 0 && (
        <section className="user-group-section">
          <div className="user-group-header">
            <h2>{getRoleLabel('owner')} — chưa gán khách sạn</h2>
            <span className="user-group-count">{orphanOwners.length} người dùng</span>
          </div>
          <UserTable
            users={orphanOwners}
            loading={loading}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        </section>
      )}

      {orphanStaff.length > 0 && (
        <section className="user-group-section">
          <div className="user-group-header">
            <h2>{getRoleLabel('staff')} — chưa gán khách sạn</h2>
            <span className="user-group-count">{orphanStaff.length} người dùng</span>
          </div>
          <UserTable
            users={orphanStaff}
            loading={loading}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        </section>
      )}

      {hasSeparateRoles && (
        <div className="hotel-separate-roles">
          <h2 className="hotel-separate-roles-title">Người dùng khác</h2>
          <UserListByRole
            roleGroups={separateRoleGroups}
            loading={loading}
            roles={HOTEL_VIEW_SEPARATE_ROLES}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        </div>
      )}
    </div>
  );
};

export default UserListByHotel;
