/**
 * User Roles Constants
 * Centralized role definitions for the application
 */
export const ROLES = {
  GUEST: 'guest',
  OWNER: 'owner',
  ADMIN: 'admin',
  STAFF: 'staff',
};

/**
 * Role display names
 */
export const ROLE_LABELS = {
  [ROLES.GUEST]: 'Khách hàng',
  [ROLES.OWNER]: 'Chủ khách sạn',
  [ROLES.ADMIN]: 'Quản trị viên',
  [ROLES.STAFF]: 'Nhân viên khách sạn',
};

/**
 * Roles that require 2FA
 */
export const ROLES_REQUIRING_2FA = [
  ROLES.ADMIN,
  ROLES.OWNER,
];

/**
 * Check if role requires 2FA
 */
export const requires2FA = (role) => {
  return ROLES_REQUIRING_2FA.includes(role);
};

