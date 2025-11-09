/**
 * StatusBadge Component
 * Reusable status badge with color coding
 */
import './StatusBadge.scss';

const STATUS_CONFIG = {
  active: { class: 'active', label: 'Hoạt động' },
  approved: { class: 'active', label: 'Đã duyệt' },
  inactive: { class: 'inactive', label: 'Không hoạt động' },
  rejected: { class: 'inactive', label: 'Từ chối' },
  pending: { class: 'pending', label: 'Chờ duyệt' },
  cancelled: { class: 'cancelled', label: 'Đã hủy' },
  completed: { class: 'completed', label: 'Hoàn thành' },
};

const StatusBadge = ({ status, showLabel = false }) => {
  const normalizedStatus = status?.toLowerCase() || '';
  const config = STATUS_CONFIG[normalizedStatus] || { 
    class: 'default', 
    label: status 
  };

  return (
    <span className={`status-badge status-badge--${config.class}`}>
      {showLabel ? config.label : status}
    </span>
  );
};

export default StatusBadge;

