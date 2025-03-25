import { useState } from 'react';
import "../styles/Login.scss";
import { setLogin } from '../redux/state';
import { useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:8001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Đăng nhập thất bại!");
        return;
      }

      const loggedIn = await response.json();

      if (loggedIn.token) {
        dispatch(setLogin({ user: loggedIn.user, token: loggedIn.token }));

        localStorage.setItem("token", loggedIn.token);
        localStorage.setItem("user", JSON.stringify(loggedIn.user));

        switch (loggedIn.user.role) {
          case "admin":
            navigate("/admin");
            break;
          case "staff":
            navigate("/staff");
            break;
          default:
            navigate("/");
            break;
        }
      }
    } catch (err) {
      setErrorMessage("Có lỗi xảy ra. Vui lòng thử lại!");
    }
  };

  return (
    <div className='login'>
      <div className='login_content'>
        <div className="login_header">
          <a href="/">
            <img src="assets/logo_black.png" alt="Website Logo" className="login_logo" />
          </a>
        </div>
        <form className='login_content_form' onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type='password'
            placeholder='Mật khẩu'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {errorMessage && <p className="error_message">{errorMessage}</p>}
          <button type="submit">ĐĂNG NHẬP</button>
        </form>
        <a href='/register'>Bạn chưa có tài khoản? Đăng ký ngay</a>
      </div>
    </div>
  );
};

export default LoginPage;
