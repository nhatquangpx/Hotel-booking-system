import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GuestLayout } from '@/features/guest/components/layout';
import './VNPayCallback.scss';

/**
 * VNPay Payment Callback Page
 * Xử lý kết quả thanh toán từ VNPay và redirect về trang đặt phòng
 */
const VNPayCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, failed
  const [message, setMessage] = useState('');
  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    // Kiểm tra kết quả từ URL params
    const responseCode = searchParams.get('vnp_ResponseCode');
    const errorMessage = searchParams.get('message');
    const transactionRef = searchParams.get('vnp_TxnRef');

    // VNPay response code '00' nghĩa là thành công
    if (responseCode === '00') {
      // Thanh toán thành công
      setStatus('success');
      setMessage('Thanh toán thành công! Đơn đặt phòng của bạn đã được xác nhận.');
      
      // Redirect về trang my-bookings sau 3 giây
      setTimeout(() => {
        navigate('/my-bookings');
      }, 3000);
    } else if (responseCode) {
      // Có response code nhưng không phải '00' - thanh toán thất bại
      setStatus('failed');
      setMessage(errorMessage || `Thanh toán thất bại. Mã lỗi: ${responseCode}`);
    } else if (errorMessage) {
      // Có error message từ server
      setStatus('failed');
      setMessage(errorMessage);
    } else {
      // Không có thông tin gì - có thể là lỗi
      setStatus('failed');
      setMessage('Không thể xác định kết quả thanh toán. Vui lòng kiểm tra lại đơn đặt phòng của bạn.');
    }
  }, [searchParams, bookingId, navigate]);

  return (
    <GuestLayout>
      <div className="vnpay-callback-container">
        <div className="callback-content">
          {status === 'loading' && (
            <>
              <div className="loading-spinner"></div>
              <h2>Đang xử lý kết quả thanh toán...</h2>
              <p>Vui lòng đợi trong giây lát</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="success-icon">✓</div>
              <h2>Thanh toán thành công!</h2>
              <p className="success-message">{message}</p>
              <p className="redirect-message">Bạn sẽ được chuyển hướng đến trang đặt phòng trong giây lát...</p>
              <button 
                className="redirect-btn"
                onClick={() => navigate('/my-bookings')}
              >
                Xem đơn đặt phòng ngay
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="error-icon">✗</div>
              <h2>Thanh toán thất bại</h2>
              <p className="error-message">{message}</p>
              <div className="action-buttons">
                <button 
                  className="retry-btn"
                  onClick={() => navigate('/my-bookings')}
                >
                  Xem đơn đặt phòng
                </button>
                <button 
                  className="back-btn"
                  onClick={() => navigate(-1)}
                >
                  Thử lại
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </GuestLayout>
  );
};

export default VNPayCallbackPage;

