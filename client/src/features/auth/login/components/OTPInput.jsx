import { useState, useRef, useEffect } from 'react';
import './OTPInput.scss';

/**
 * OTP Input Component
 * Supports both 6-digit OTP and backup codes
 */
export const OTPInput = ({ onComplete, onResend, isLoading = false, errorMessage = '' }) => {
  const [inputType, setInputType] = useState('otp'); // 'otp' or 'backup'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [backupCode, setBackupCode] = useState('');
  const [localErrorMessage, setLocalErrorMessage] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const inputRefs = useRef([]);
  const backupCodeInputRef = useRef(null);

  // Sync external error message
  useEffect(() => {
    setLocalErrorMessage(errorMessage);
  }, [errorMessage]);

  useEffect(() => {
    // Focus appropriate input based on type
    if (inputType === 'otp' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    } else if (inputType === 'backup' && backupCodeInputRef.current) {
      backupCodeInputRef.current.focus();
    }
  }, [inputType]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all inputs are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      onComplete(newOtp.join(''), rememberDevice);
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      const newOtp = [...otp];
      
      digits.forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      
      setOtp(newOtp);
      
      // Focus last input
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }

      // Trigger onComplete
      if (newOtp.every(digit => digit !== '')) {
        onComplete(newOtp.join(''), rememberDevice);
      }
    }
  };

  const handleResend = () => {
    setOtp(['', '', '', '', '', '']);
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    onResend();
  };

  const handleBackupCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 8);
    setBackupCode(value);
    
    // Auto-submit when 8 characters are entered
    if (value.length === 8) {
      onComplete(value, rememberDevice);
    }
  };

  const handleBackupCodeKeyDown = (e) => {
    if (e.key === 'Enter' && backupCode.length === 8) {
      e.preventDefault();
      onComplete(backupCode, rememberDevice);
    }
  };

  const handleBackupCodeSubmit = (e) => {
    e.preventDefault();
    if (backupCode.length === 8) {
      onComplete(backupCode, rememberDevice);
    }
  };

  const handleInputTypeChange = (type) => {
    setInputType(type);
    setOtp(['', '', '', '', '', '']);
    setBackupCode('');
    setLocalErrorMessage('');
  };

  return (
    <div className="otp-input-container">
      {/* Toggle between OTP and Backup Code */}
      <div className="input-type-toggle">
        <button
          type="button"
          className={`toggle-btn ${inputType === 'otp' ? 'active' : ''}`}
          onClick={() => handleInputTypeChange('otp')}
          disabled={isLoading}
        >
          Mã OTP
        </button>
        <button
          type="button"
          className={`toggle-btn ${inputType === 'backup' ? 'active' : ''}`}
          onClick={() => handleInputTypeChange('backup')}
          disabled={isLoading}
        >
          Mã dự phòng
        </button>
      </div>

      {inputType === 'otp' ? (
        <>
          <div className="otp-input-wrapper">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isLoading}
                className={`otp-input ${localErrorMessage ? 'error' : ''}`}
              />
            ))}
          </div>

          <div className="otp-actions">
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading}
              className="resend-otp-btn"
            >
              Gửi lại mã OTP
            </button>
          </div>

          <p className="otp-help-text">
            Mã OTP đã được gửi đến email của bạn. Mã có hiệu lực trong 10 phút.
          </p>

          <div className="remember-device-checkbox">
            <label>
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                disabled={isLoading}
              />
              <span>Nhớ thiết bị này trong 30 ngày</span>
            </label>
          </div>
        </>
      ) : (
        <form onSubmit={handleBackupCodeSubmit} className="backup-code-form">
          <div className="backup-code-input-wrapper">
            <input
              ref={backupCodeInputRef}
              type="text"
              value={backupCode}
              onChange={handleBackupCodeChange}
              onKeyDown={handleBackupCodeKeyDown}
              placeholder="Nhập mã dự phòng (8 ký tự)"
              maxLength="8"
              disabled={isLoading}
              className={`backup-code-input ${localErrorMessage ? 'error' : ''}`}
              style={{
                fontFamily: 'Courier New, monospace',
                fontSize: '18px',
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}
            />
          </div>

          <p className="backup-code-help-text">
            Nhập một trong các mã dự phòng bạn đã lưu khi bật xác thực 2 lớp.
            Mỗi mã chỉ có thể sử dụng một lần.
          </p>

          <div className="remember-device-checkbox">
            <label>
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                disabled={isLoading}
              />
              <span>Nhớ thiết bị này trong 30 ngày</span>
            </label>
          </div>
        </form>
      )}

      {localErrorMessage && (
        <div className="otp-error-message">{localErrorMessage}</div>
      )}
    </div>
  );
};
