const API_URL = "http://localhost:8001/api/admin";

// Get all users
export const getAllUsers = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/get-all-users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Không thể lấy danh sách người dùng!");
  }
  
  return await response.json();
};

// Get user by ID
export const getUserById = async (userId) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/get-user/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Không thể lấy thông tin người dùng!");
  }
  
  return await response.json();
};

// Create new user
export const createUser = async (userData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/create-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Không thể tạo người dùng mới!");
  }
  
  return await response.json();
};

// Update user
export const updateUser = async (userId, userData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/update-user/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Không thể cập nhật thông tin người dùng!");
  }
  
  return await response.json();
};

// Delete user
export const deleteUser = async (userId) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/delete-user/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Không thể xóa người dùng!");
  }
  
  return await response.json();
}; 