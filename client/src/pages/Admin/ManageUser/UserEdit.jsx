import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { userAPI } from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';

const UserEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'user',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await userAPI.getUserById(id);
        setFormData({
          fullName: data.fullName,
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
      await userAPI.updateUser(id, formData);
      navigate(`/admin/users/${id}`);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật thông tin người dùng');
      setSaving(false);
    }
  };

  if (loading) return (
    <AdminLayout>
      <div>Đang tải...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="admin-form-container">
        <h2>Chỉnh sửa thông tin người dùng</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Họ tên</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
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
              <option value="user">Người dùng</option>
              <option value="staff">Nhân viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mật khẩu mới (để trống nếu không đổi)</label>
            <input
              type="password"
              id="password"
              name="password"
              onChange={handleChange}
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => navigate(`/admin/users/${id}`)} className="cancel-btn">
              Hủy
            </button>
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