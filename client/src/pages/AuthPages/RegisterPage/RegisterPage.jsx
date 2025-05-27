import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import "./Register.scss";
import { registerUser } from "../../../services/authService";
import Slide from '../../../components/Slide/Slide';

const sliderImages = [
  '/assets/slide1.jpg',
  '/assets/slide2.jpg',
  '/assets/slide3.jpg',
];

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [agree, setAgree] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        setPasswordMatch(
            formData.password === formData.confirmPassword || formData.confirmPassword === ""
        );
    }, [formData.password, formData.confirmPassword]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        if (!passwordMatch) {
            setErrorMessage("Mật khẩu không khớp!");
            return;
        }
        if (!agree) {
            setErrorMessage("Bạn phải đồng ý với điều khoản và chính sách.");
            return;
        }
        try {
            await registerUser({
                fullName: formData.firstName + ' ' + formData.lastName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
            });
            navigate("/login");
        } catch (err) {
            setErrorMessage(err.message);
            console.error("Registration failed", err.message);
        }
    };

    return (
        <div className="register-container">
            <div className="register-left">
                <Slide
                    images={sliderImages}
                    showTitle={false}
                    className="register-slide"
                    slideHeight="100%"
                />
            </div>
            <div className="register-right">
                <div className="logo">
                    <a href="/">
                        <img src="/assets/logo_black_horizontal.png" alt="Logo" />
                    </a>
                </div>
                <div className="register-form-container">
                    <h1>Đăng ký</h1>
                    <p className="subtitle">Chào mừng bạn đến với StayJourney</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Họ</label>
                                <input
                                    placeholder='Nguyen'
                                    name='firstName'
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Tên</label>
                                <input
                                    placeholder='A'
                                    name='lastName'
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    placeholder='example@gmail.com'
                                    name='email'
                                    type='email'
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Số điện thoại</label>
                                <input
                                    placeholder='0123456789'
                                    name='phone'
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Mật khẩu</label>
                            <input
                                placeholder='Mật khẩu phải có 6 kí tự trở lên'
                                name='password'
                                value={formData.password}
                                onChange={handleChange}
                                type='password'
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Xác nhận mật khẩu</label>
                            <input
                                placeholder='Nhập lại mật khẩu'
                                name='confirmPassword'
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                type='password'
                                required
                            />
                        </div>
                        {!passwordMatch && (
                            <div className="error-message">Mật khẩu không khớp!</div>
                        )}
                        {errorMessage && <div className="error-message">{errorMessage}</div>}
                        <div className="form-options">
                            <label className="agree-checkbox">
                                <input
                                    type="checkbox"
                                    checked={agree}
                                    onChange={e => setAgree(e.target.checked)}
                                />
                                <span>Tôi đồng ý với tất cả <a href="#" className="terms">Điều khoản dịch vụ</a> and <a href="#" className="privacy">Chính sách bảo mật</a></span>
                            </label>
                        </div>
                        <button type="submit" className="register-button">Tạo tài khoản</button>
                    </form>
                    <p className="login-prompt">
                        Bạn đã có tài khoản? <a href="/login">Đăng nhập</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
