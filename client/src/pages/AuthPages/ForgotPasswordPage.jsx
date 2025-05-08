import { useState } from 'react';
import "../../styles/Auth/Login.scss"; 
import { sendResetPasswordEmail } from "../../services/authService";

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
    <div className='login'>
      <div className='login_content'>
        <div className="login_header">
          <a href="/">
            <img src="/assets/logo_black.png" alt="Website Logo" className="login_logo" />
          </a>
        </div>
        <form className='login_content_form' onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder='Nhập email của bạn'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {message && <p style={{ color: 'lightgreen', textAlign: 'center' }}>{message}</p>}
          {errorMessage && <p className="error_message">{errorMessage}</p>}
          <button type="submit">GỬI MẬT KHẨU MỚI</button>
        </form>
        <a href="/login">Quay lại trang đăng nhập</a>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
