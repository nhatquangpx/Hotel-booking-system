import { useState, useEffect } from 'react';
import "./Login.scss";
import { setLogin } from '../../../redux/state';
import { useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import api from "../../../apis";
import Slide from '../../../components/User/Slide/Slide';

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
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
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
    
    if (!email || !password) {
      setErrorMessage("Vui lòng nhập email và mật khẩu");
      return;
    }
    
    setErrorMessage("");
    setIsLoading(true);

    try {
      const result = await api.auth.login({ email, password });
      
      if (!result) {
        throw new Error("Không nhận được phản hồi từ máy chủ");
      }

      if (result.token) {
        dispatch(setLogin({ user: result.user, token: result.token }));

        if (rememberMe) { 
          localStorage.setItem("rememberedEmail", email);
          localStorage.setItem("rememberedPassword", password);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberedPassword");
          localStorage.removeItem("rememberMe");
        }

        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));

        switch (result.user.role) {
          case "admin":
            navigate("/admin");
            break;
          case "owner":
            navigate("/owner");
            break;
          default:
            navigate("/");
            break;
        }
      } else {
        console.error("Thiếu token trong kết quả đăng nhập:", result);
        setErrorMessage("Đăng nhập thất bại. Dữ liệu không hợp lệ từ máy chủ.");
      }
    } catch (err) {
      console.error("Login error:", err);
      // Hiển thị thông báo lỗi chi tiết từ server hoặc thông báo mặc định
      if (err.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Đăng nhập thất bại. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
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
              <a href="/forgotpassword" className="forgot-password">Quên mật khẩu</a>
            </div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
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
