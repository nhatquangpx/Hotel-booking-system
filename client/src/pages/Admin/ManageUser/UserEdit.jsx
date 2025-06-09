import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../../apis';
import AdminLayout from '../../../components/Admin/AdminLayout';
import './UserEdit.scss';

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'guest',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null); 

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await api.adminUser.getUserById(id);
        setFormData({
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
        });
        setError(null);
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

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
      await api.adminUser.updateUser(id, formData);
      navigate(`/admin/users/${id}`);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật thông tin người dùng');
      setSaving(false);
    }
  };

  if (loading) return (
    <AdminLayout>
      <div className="loading">Đang tải...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="user-edit-container">
        <h1>Chỉnh sửa thông tin người dùng</h1>
        {error && <div className="error-message">{error}</div>}
        
        <form className="edit-form" onSubmit={handleSubmit}>
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
            <Tooltip title="Quay lại">
              <IconButton 
                color="primary"
                onClick={() => navigate('/admin/users')}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default UserEdit; 