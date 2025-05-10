import { useState } from 'react';
import "../../styles/Auth/Login.scss"; 
import { sendResetPasswordEmail } from "../../services/authService";
import Slide from '../../components/Slide';

const sliderImages = [
  '/assets/slide1.jpg',
  '/assets/slide2.jpg',
  '/assets/slide3.jpg',
];

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    try {
      const res = await sendResetPasswordEmail(email);
      setMessage(res.message);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="logo">
          <a href="/">        
            <img src="/assets/logo_black_horizontal.png" alt="StayJourney Logo" />
          </a>
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
            <a href="/login">Quay lại trang đăng nhập</a>
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

export default ForgotPasswordPage;
