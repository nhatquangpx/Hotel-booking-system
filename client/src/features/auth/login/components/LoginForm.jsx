import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '@/apis';
import { setLogin } from '@/store/slices/userSlice';
import { resolvePostLoginNavigation } from '@/shared/utils';
import { Slide } from '@/components';
import { IMAGE_PATHS } from '@/constants/images';
import { DEFAULT_SLIDE_IMAGES } from '@/constants/slides';
import { OTPInput } from './OTPInput';
import './LoginForm.scss';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 2FA states
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState(null);
  const [otpErrorMessage, setOtpErrorMessage] = useState('');
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const redirectAfterLogin = (loggedInUser) => {
    const target = resolvePostLoginNavigation(loggedInUser, location.state);
    navigate(
      {
        pathname: target.pathname,
        search: target.search || '',
        hash: target.hash || '',
      },
      { replace: true, state: target.state }
    );
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const savedRememberMe = localStorage.getItem('rememberMe');

    if (savedRememberMe === 'true' && savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (location.state?.authMessage) {
      setErrorMessage(location.state.authMessage);
    }
  }, [location.state?.authMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setErrorMessage('Vui lòng nhập email và mật khẩu');
      return;
    }
    
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await api.auth.login({ email, password });
      
      if (!result) {
        throw new Error('Không nhận được phản hồi từ máy chủ');
      }

      // Check if 2FA is required
      if (result.requires2FA && result.userId) {
        setRequires2FA(true);
        setUserId(result.userId);
        setErrorMessage('');
        setIsLoading(false);
        return;
      }

      if (result.user) {
        dispatch(setLogin({ user: result.user }));

        if (rememberMe) { 
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedPassword', password);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
          localStorage.removeItem('rememberMe');
        }

        redirectAfterLogin(result.user);
      } else {
        console.error('Thiếu thông tin user trong kết quả đăng nhập:', result);
        setErrorMessage('Đăng nhập thất bại. Dữ liệu không hợp lệ từ máy chủ.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Đăng nhập thất bại. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPComplete = async (otpCode, rememberDevice = false) => {
    if (!userId) {
      setOtpErrorMessage('Lỗi: Không tìm thấy thông tin người dùng');
      return;
    }

    setIsVerifyingOTP(true);
    setOtpErrorMessage('');

    try {
      const result = await api.auth.verify2FA(userId, otpCode, rememberDevice);

      if (result.user) {
        dispatch(setLogin({ user: result.user }));

        if (rememberMe) { 
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedPassword', password);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
          localStorage.removeItem('rememberMe');
        }

        redirectAfterLogin(result.user);
      } else {
        setOtpErrorMessage('Xác thực thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('2FA verification error:', err);
      setOtpErrorMessage(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    if (!userId) return;

    setIsVerifyingOTP(true);
    setOtpErrorMessage('');

    try {
      await api.auth.resend2FAOTP(userId);
      setOtpErrorMessage('');
    } catch (err) {
      console.error('Resend OTP error:', err);
      setOtpErrorMessage(err.message || 'Không thể gửi lại mã OTP');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="logo">
          <Link to="/">        
            <img src={IMAGE_PATHS.LOGO_HORIZONTAL} alt="StayJourney Logo" />
          </Link>
        </div>
        <div className="login-form-container">
          <h1>{requires2FA ? 'Xác thực 2 lớp' : 'Đăng nhập'}</h1>       

          {!requires2FA ? (
            <>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-options">
                  <label className="remember-me">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span>Lưu đăng nhập</span>
                  </label>
                  <Link to="/forgotpassword" className="forgot-password">Quên mật khẩu</Link>
                </div>

                {errorMessage && <div className="error-message">{errorMessage}</div>}

                <button type="submit" className="login-button" disabled={isLoading}>
                  {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
              </form>

              <p className="signup-prompt">
                Bạn chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
              </p>
            </>
          ) : (
            <div className="two-factor-auth-container">
              <p className="twofa-description">
                Vui lòng nhập mã OTP đã được gửi đến email <strong>{email}</strong>
              </p>
              
              <OTPInput
                onComplete={handleOTPComplete}
                onResend={handleResendOTP}
                isLoading={isVerifyingOTP}
                errorMessage={otpErrorMessage}
              />

              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setUserId(null);
                  setOtpErrorMessage('');
                }}
                className="back-to-login-btn"
                disabled={isVerifyingOTP}
              >
                Quay lại đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="login-right">
        <Slide
          images={DEFAULT_SLIDE_IMAGES}
          showTitle={false}
          className="login-slide"
          slideHeight="100%"
          borderRadius="30px"
        />
      </div>
    </div>
  );
};

