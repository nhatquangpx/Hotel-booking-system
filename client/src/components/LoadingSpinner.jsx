/**
 * LoadingSpinner Component
 * Reusable loading spinner for async operations
 */
import './LoadingSpinner.scss';

const LoadingSpinner = ({ message = 'Đang tải...', size = 'medium' }) => {
  return (
    <div className={`loading-spinner loading-spinner--${size}`}>
      <div className="spinner"></div>
      {message && <p className="loading-spinner__message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;

