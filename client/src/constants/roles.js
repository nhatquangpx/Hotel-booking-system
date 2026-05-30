/**
 * User Roles Constants
 */
export const ROLES = {
  GUEST: 'guest',
  OWNER: 'owner',
  ADMIN: 'admin',
  STAFF: 'staff',
};

/** Thứ tự hiển thị nhóm user (admin UI) */
export const ROLE_ORDER = [
  ROLES.ADMIN,
  ROLES.OWNER,
  ROLES.STAFF,
  ROLES.GUEST,
];

export const ROLE_LABELS = {
  [ROLES.GUEST]: 'Khách hàng',
  [ROLES.OWNER]: 'Chủ khách sạn',
  [ROLES.ADMIN]: 'Quản trị viên',
  [ROLES.STAFF]: 'Nhân viên khách sạn',
};

export const ROLES_REQUIRING_2FA = [ROLES.ADMIN, ROLES.OWNER];

export const requires2FA = (role) => ROLES_REQUIRING_2FA.includes(role);

export const getRoleLabel = (role) =>
  ROLE_LABELS[role] || role || 'Không xác định';
