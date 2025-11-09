/**
 * ErrorMessage Component
 * Reusable error message display
 */
import './ErrorMessage.scss';

const ErrorMessage = ({ message, onRetry, retryText = 'Thử lại' }) => {
  if (!message) return null;

  return (
    <div className="error-message">
      <div className="error-message__icon">
        <i className="fas fa-exclamation-circle"></i>
      </div>
      <div className="error-message__content">
        <p className="error-message__text">{message}</p>
        {onRetry && (
          <button className="error-message__retry" onClick={onRetry}>
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;

