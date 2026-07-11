import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Dialog from '@/components/ui/Dialog';
import api from '../../../../apis';
import { apiErrorMessage, formatDateTime } from '@/shared/utils';
import './UserFormDialog.scss';

/**
 * Form tạo/sửa user.
 * `staffHotelId`: khách sạn gán cho nhân viên (gửi API là assignedHotelId → cập nhật Hotel.staffIds, không lưu trên User).
 */
const KEEP_INACTIVE_UNTIL = 'keep';

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'guest',
  status: 'active',
  staffHotelId: '',
  inactiveDays: '',
  inactiveReason: '',
  inactiveUntilLabel: '',
};

const UserFormDialog = ({ 
  isOpen, 
  onClose, 
  userId = null, 
  onSuccess 
}) => {
  const isEdit = !!userId;
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [initialStatus, setInitialStatus] = useState('active');
  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchHotels();
      if (isEdit) {
        fetchUser();
      } else {
        setFormData({ ...INITIAL_FORM });
        setInitialStatus('active');
        setError(null);
      }
    }
  }, [isOpen, userId]);

  const fetchHotels = async () => {
    try {
      setHotelsLoading(true);
      const result = await api.adminHotel.getAllHotels({ all: true });
      const data = result.items || [];
      setHotels(Array.isArray(data) ? data : []);
    } catch {
      setHotels([]);
    } finally {
      setHotelsLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await api.adminUser.getUserById(userId);
      const hotelFromApi = data.assignedHotelId;
      const hotelId = hotelFromApi?._id || hotelFromApi || '';
      const status = data.status || 'active';
      const hasTempBan = status === 'inactive' && data.inactiveUntil;
      setInitialStatus(status);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        password: '',
        role: data.role || 'guest',
        status,
        staffHotelId: hotelId ? String(hotelId) : '',
        // Giữ thời hạn hiện tại — không gửi inactiveDays trừ khi admin đổi
        inactiveDays: hasTempBan ? KEEP_INACTIVE_UNTIL : '',
        inactiveReason: data.inactiveReason || '',
        inactiveUntilLabel: hasTempBan ? formatDateTime(data.inactiveUntil) : '',
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
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'role' && value !== 'staff') {
        next.staffHotelId = '';
      }
      if (name === 'status' && value === 'inactive' && initialStatus === 'active') {
        next.inactiveDays = '7';
        next.inactiveUntilLabel = '';
      }
      if (name === 'status' && value === 'active') {
        next.inactiveDays = '';
        next.inactiveReason = '';
        next.inactiveUntilLabel = '';
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      
      const {
        staffHotelId,
        password,
        inactiveDays,
        inactiveReason,
        inactiveUntilLabel: _inactiveUntilLabel,
        ...rest
      } = formData;
      const payload = { ...rest };

      if (isEdit) {
        delete payload.password;
      } else if (password) {
        payload.password = password;
      }

      if (payload.role === 'staff') {
        if (!staffHotelId) {
          setError('Vui lòng chọn khách sạn cho nhân viên');
          setSaving(false);
          return;
        }
        payload.assignedHotelId = staffHotelId;
      }

      if (isEdit && payload.status === 'inactive' && payload.role === 'guest') {
        // Chỉ gửi inactiveDays khi admin chủ động đặt/đổi thời hạn — tránh xóa cấm tạm
        if (inactiveDays !== KEEP_INACTIVE_UNTIL) {
          if (inactiveDays === '' || inactiveDays === 'permanent') {
            payload.inactiveDays = null;
          } else {
            payload.inactiveDays = Number(inactiveDays);
          }
        }
        payload.inactiveReason = inactiveReason || '';
      }

      if (isEdit) {
        await api.adminUser.updateUser(userId, payload);
      } else {
        await api.adminUser.createUser(payload);
      }
      
      onSuccess?.();
      onClose();
      toast.success(isEdit ? 'Cập nhật người dùng thành công' : 'Tạo người dùng thành công');
    } catch (err) {
      const msg = apiErrorMessage(err, `Có lỗi xảy ra khi ${isEdit ? 'cập nhật' : 'tạo'} người dùng`);
      setError(msg);
      toast.error(msg);
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
              <option value="staff">Nhân viên khách sạn</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          {formData.role === 'staff' && (
            <div className="form-group">
              <label htmlFor="staffHotelId">Khách sạn làm việc</label>
              <select
                id="staffHotelId"
                name="staffHotelId"
                value={formData.staffHotelId}
                onChange={handleChange}
                required
                disabled={hotelsLoading}
              >
                <option value="">
                  {hotelsLoading ? 'Đang tải khách sạn...' : 'Chọn khách sạn'}
                </option>
                {hotels.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
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

          {isEdit && formData.status === 'inactive' && formData.role === 'guest' && (
            <>
              <div className="form-group">
                <label htmlFor="inactiveDays">Thời gian vô hiệu hóa</label>
                <select
                  id="inactiveDays"
                  name="inactiveDays"
                  value={formData.inactiveDays}
                  onChange={handleChange}
                >
                  {formData.inactiveDays === KEEP_INACTIVE_UNTIL && (
                    <option value={KEEP_INACTIVE_UNTIL}>
                      Giữ thời hạn hiện tại
                      {formData.inactiveUntilLabel
                        ? ` (đến ${formData.inactiveUntilLabel})`
                        : ''}
                    </option>
                  )}
                  <option value="">Không thời hạn</option>
                  <option value="3">3 ngày</option>
                  <option value="7">7 ngày</option>
                  <option value="14">14 ngày</option>
                  <option value="30">30 ngày</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="inactiveReason">Lý do</label>
                <input
                  type="text"
                  id="inactiveReason"
                  name="inactiveReason"
                  value={formData.inactiveReason}
                  onChange={handleChange}
                  placeholder="Ví dụ: Hủy đơn liên tục"
                />
              </div>
            </>
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
