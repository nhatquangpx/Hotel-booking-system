import { useState, useEffect } from 'react';
import "../../styles/Auth/Login.scss";
import { setLogin } from '../../redux/state';
import { useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import { loginUser } from "../../services/authService";
import Slide from '../../components/Slide';

const sliderImages = [
  '/assets/slide1.jpg',
  '/assets/slide2.jpg',
  '/assets/slide3.jpg',
];

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // Check for saved credentials when component mounts
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    const savedRememberMe = localStorage.getItem("rememberMe");

    if (savedRememberMe === "true" && savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const loggedIn = await loginUser(email, password);

      if (loggedIn.token) {
        dispatch(setLogin({ user: loggedIn.user, token: loggedIn.token }));

        // Save credentials if remember me is checked
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
          localStorage.setItem("rememberedPassword", password);
          localStorage.setItem("rememberMe", "true");
        } else {
          // Clear saved credentials if remember me is unchecked
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberedPassword");
          localStorage.removeItem("rememberMe");
        }

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
          <h1>Đăng nhập</h1>
          <p className="subtitle">Chào mừng bạn đã quay trở lại với StayJourney</p>
          
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

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="/forgotpassword" className="forgot-password">Quên mật khẩu</a>
            </div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <button type="submit" className="login-button">Đăng nhập</button>
          </form>

          <p className="signup-prompt">
            Bạn chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
          </p>
        </div>
      </div>
      
      <div className="login-right">
        <Slide
          images={sliderImages}
          showTitle={false}
          className="login-slide"
          slideHeight="100%"
          borderRadius="30px"
        />
      </div>
    </div>
  );
};

export default LoginPage;
