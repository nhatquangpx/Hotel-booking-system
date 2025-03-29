const API_URL = "http://localhost:8001/auth";

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
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Đăng ký thất bại!");
    }
    return await response.json();
  };
  