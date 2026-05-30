import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getRoleAccessDeniedContent } from '@/shared/utils/roleAccessMessages';
import './RoleAccessDenied.scss';

/**
 * Hiển thị khi user đã đăng nhập nhưng role không khớp ProtectedRoute.
 */
const RoleAccessDenied = ({ currentRole, allowedRoles }) => {
  const { title, description, portalPath, portalLabel } = getRoleAccessDeniedContent(
    currentRole,
    allowedRoles
  );

  useEffect(() => {
    toast.error(description, { toastId: `role-denied-${allowedRoles?.join('-')}` });
  }, [description, allowedRoles]);

  return (
    <div className="role-access-denied">
      <div className="role-access-denied__card">
        <h1 className="role-access-denied__title">{title}</h1>
        <p className="role-access-denied__message">{description}</p>
        <div className="role-access-denied__actions">
          <Link to={portalPath} className="role-access-denied__btn role-access-denied__btn--primary">
            {portalLabel}
          </Link>
          <Link to="/" className="role-access-denied__btn role-access-denied__btn--secondary">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoleAccessDenied;
