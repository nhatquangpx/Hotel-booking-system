/**
 * SuccessMessage Component
 * Reusable success message display
 */
import './SuccessMessage.scss';

const SuccessMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="success-message">
      <div className="success-message__icon">
        <i className="fas fa-check-circle"></i>
      </div>
      <div className="success-message__content">
        <p className="success-message__text">{message}</p>
      </div>
      {onClose && (
        <button className="success-message__close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
};

export default SuccessMessage;

