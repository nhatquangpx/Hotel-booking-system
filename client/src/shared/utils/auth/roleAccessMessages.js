import { ROLE_LABELS } from '@/constants/roles';
import { ROLE_HOME_ROUTES, ROUTES } from '@/constants/routes';

export const getRoleLabel = (role) =>
  ROLE_LABELS[role] || role || 'Không xác định';

export const formatRequiredRoles = (allowedRoles = []) => {
  const labels = allowedRoles.map(getRoleLabel).filter(Boolean);
  if (labels.length === 0) return 'tài khoản được phép';
  if (labels.length === 1) return labels[0];
  return labels.join(', ');
};

export const getPortalPathForRole = (role) =>
  ROLE_HOME_ROUTES[role] || ROUTES.HOME;

export const getRoleAccessDeniedContent = (currentRole, allowedRoles = []) => {
  const requiredText = formatRequiredRoles(allowedRoles);
  const currentText = currentRole ? getRoleLabel(currentRole) : null;

  let description;
  if (!currentRole) {
    description = `Trang này chỉ dành cho ${requiredText}. Vui lòng đăng nhập đúng loại tài khoản.`;
  } else {
    description = `Bạn đang đăng nhập với vai trò ${currentText}. Trang này chỉ dành cho ${requiredText}.`;
  }

  const portalPath = currentRole ? getPortalPathForRole(currentRole) : ROUTES.LOGIN;
  const portalLabel = currentRole
    ? `Đi tới khu vực ${getRoleLabel(currentRole)}`
    : 'Đăng nhập';

  return {
    title: 'Không có quyền truy cập trang',
    description,
    portalPath,
    portalLabel,
    requiredText,
    currentText,
  };
};

export const LOGIN_REQUIRED_MESSAGE =
  'Vui lòng đăng nhập để truy cập trang này.';
