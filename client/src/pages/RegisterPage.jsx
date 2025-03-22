import { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom"
import "../styles/Register.scss"
const RegisterPage = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const handleChange = (e) => {
        const {name, value} = e.target
        setFormData({
            ...formData,
            [name]: value,
        })
    }
    const [passwordMatch, setPasswordMatch] = useState (true);

    useEffect(() => {
        setPasswordMatch(
            formData.password === formData.confirmPassword || formData.confirmPassword === ""
        );
    }, [formData.password, formData.confirmPassword]);
    

    const navigate = useNavigate()

    const handleSubmit =async (e) =>{
        e.preventDefault()
       
        try {  
            const register_form = new FormData();

            for (var key in formData) {
                register_form.append(key, formData[key])
            }
            const response = await fetch("http://localhost:8001/auth/register",{
                method: "POST",
                body: register_form
            })
            if (response.ok) {
                navigate("/login")
            }
        } catch (err) {
                console.log("Registration failed", err.message)
        }
    }
    console.log(formData);
    return (
        <div className='register'>
            <div className="register_header">
            <a href="/">
                <img src="assets/logo_white.png" alt="Website Logo" className="register_logo"  style={{ maxWidth: "500px" }} />
            </a>
            </div>
            <div className='register_content'>
                <form className='register_content_form' onSubmit = {handleSubmit}>
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
                        <p style = {{ color: "red"}}>Mật khẩu không khớp!</p>
                    )} 
                    
                    <button type="submit">ĐĂNG KÝ</button>
                </form>
                <a href="/login"> Bạn đã có tài khoản? Đăng nhập ngay</a>
            </div>
        </div>
    )
}

export default RegisterPage