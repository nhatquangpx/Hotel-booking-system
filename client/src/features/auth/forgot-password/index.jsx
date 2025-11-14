import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../apis';
import { Slide } from '@/components';
import { IMAGE_PATHS } from '../../../constants/images';
import './Login.scss';

const sliderImages = [
  IMAGE_PATHS.SLIDE_1,
  IMAGE_PATHS.SLIDE_2,
  IMAGE_PATHS.SLIDE_3,
];

/**
 * Auth Forgot Password page feature
 * Forgot password page for password recovery
 */
const AuthForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    try {
      const res = await api.auth.forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setErrorMessage(err.message);
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
          <h1>Quên mật khẩu</h1>
          <p className="subtitle">Nhập email của bạn để nhận mật khẩu mới</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {message && <p style={{ color: 'lightgreen', textAlign: 'center' }}>{message}</p>}
            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <button type="submit" className="login-button">Gửi mật khẩu mới</button>
          </form>

          <p className="signup-prompt">
            <Link to="/login">Quay lại trang đăng nhập</Link>
          </p>
        </div>
      </div>
      
      <div className="login-right">
        <Slide
          images={sliderImages}
          showTitle={false}
          className="login-slide"
          slideHeight="100%"
        />
      </div>
    </div>
  );
};

export default AuthForgotPasswordPage;

