import { useState } from 'react';
import "../styles/Auth/Login.scss";
import { setLogin } from '../redux/state';
import { useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { loginUser } from "../services/authService";

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
      const loggedIn = await loginUser(email, password);

      if (loggedIn.token) {
        dispatch(setLogin({ user: loggedIn.user, token: loggedIn.token }));

        localStorage.setItem("token", loggedIn.token);
        localStorage.setItem("user", JSON.stringify(loggedIn.user));

        // Điều hướng dựa trên role
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
      setErrorMessage(err.message);
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
