import React, { useState, useEffect } from 'react';
import Dialog from '@/components/ui/Dialog';
import api from '../../../../apis';
import './UserFormDialog.scss';

/**
 * User Form Dialog Component
 * Reusable dialog for creating and editing users
 */
const UserFormDialog = ({ 
  isOpen, 
  onClose, 
  userId = null, 
  onSuccess 
}) => {
  const isEdit = !!userId;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'guest',
    status: 'active'
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (isEdit) {
        fetchUser();
      } else {
        // Reset form for create
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          role: 'guest',
          status: 'active'
        });
        setError(null);
      }
    }
  }, [isOpen, userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await api.adminUser.getUserById(userId);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        password: '',
        role: data.role || 'guest',
        status: data.status || 'active'
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

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
      setError(null);
      
      if (isEdit) {
        await api.adminUser.updateUser(userId, formData);
      } else {
        await api.adminUser.createUser(formData);
      }
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || `Có lỗi xảy ra khi ${isEdit ? 'cập nhật' : 'tạo'} người dùng`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa người dùng' : 'Tạo người dùng mới'}
      maxWidth="500px"
      className="user-form-dialog"
    >
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <form className="user-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
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
          
          {!isEdit && (
            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={!isEdit}
              />
            </div>
          )}
          
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
          
          {isEdit && (
            <div className="form-group">
              <label htmlFor="status">Trạng thái</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
            </div>
          )}
          
          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? (isEdit ? 'Đang lưu...' : 'Đang tạo...') : (isEdit ? 'Lưu thay đổi' : 'Tạo người dùng')}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
};

export default UserFormDialog;

