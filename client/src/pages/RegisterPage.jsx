import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import "../styles/Register.scss";
import { registerUser } from "../services/authService";

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    
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

        try {
            const form = new FormData();
            for (let key in formData) {
                form.append(key, formData[key]);
            }

            await registerUser(form);
            navigate("/login");
        } catch (err) {
            setErrorMessage(err.message);
            console.error("Registration failed", err.message);
        }
    };

    return (
        <div className='register'>
            <div className="register_header">
                <a href="/">
                    <img src="assets/logo_white.png" alt="Website Logo" className="register_logo" style={{ maxWidth: "500px" }} />
                </a>
            </div>
            <div className='register_content'>
                <form className='register_content_form' onSubmit={handleSubmit}>
                    <input
                        placeholder='Họ'
                        name='firstName'
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />
                    <input
                        placeholder='Tên'
                        name='lastName'
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                    <input
                        placeholder='Email'
                        name='email'
                        type='email'
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <input
                        placeholder='Mật khẩu'
                        name='password'
                        value={formData.password}
                        onChange={handleChange}
                        type='password'
                        required
                    />
                    <input
                        placeholder='Nhập lại mật khẩu'
                        name='confirmPassword'
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        type='password'
                        required
                    />
                    {!passwordMatch && (
                        <p style={{ color: "red" }}>Mật khẩu không khớp!</p>
                    )}
                    {errorMessage && <p className="error_message">{errorMessage}</p>}
                    <button type="submit">ĐĂNG KÝ</button>
                </form>
                <a href="/login">Bạn đã có tài khoản? Đăng nhập ngay</a>
            </div>
        </div>
    );
};

export default RegisterPage;
