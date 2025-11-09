import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/features/admin/components';
import api from '../../../../apis';
import './UserCreate.scss';

/**
 * Admin User Create page feature
 * Create new user for admin
 */
const AdminUserCreatePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'guest',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.adminUser.createUser(formData);
      navigate('/admin/users');
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tạo người dùng mới');
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="user-create-container">
        <h1>Tạo người dùng mới</h1>
        {error && <div className="error-message">{error}</div>}
        
        <form className="create-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Họ tên</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Số điện thoại</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="role">Vai trò</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="guest">Khách</option>
              <option value="owner">Chủ khách sạn</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => navigate('/admin/users')} className="cancel-btn">
              Hủy
            </button>
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? 'Đang tạo...' : 'Tạo người dùng'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminUserCreatePage;

