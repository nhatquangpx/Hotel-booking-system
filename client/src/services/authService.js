const API_URL = "http://localhost:8001/api/auth";

  // Hàm đăng nhập
export const loginUser = async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Đăng nhập thất bại!");
    }
    return await response.json();
  };
  
  // Hàm đăng ký
  export const registerUser = async (formData) => {
    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Đăng ký thất bại!");
    }
    return await response.json();
};

  
  // Hàm gửi email khôi phục mật khẩu
  export const sendResetPasswordEmail = async (email) => {
    const response = await fetch(`${API_URL}/forgotpassword`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Gửi email khôi phục thất bại!");
    }
    return await response.json();
  };