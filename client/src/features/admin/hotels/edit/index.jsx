import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/features/admin/components';
import api from '../../../../apis';
import { getImageUrl } from '../../../../constants/images';
import './HotelEdit.scss';

/**
 * Admin Hotel Edit page feature
 * Edit hotel information for admin
 */
const AdminHotelEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    ownerId: '',
    description: '',
    address: {
      number: '',
      street: '',
      city: '',
    },
    images: [],
    starRating: 1,
    contactInfo: {
      phone: '',
      email: '',
    },
    policies: {
      checkInTime: '14:00',
      checkOutTime: '12:00',
    },
    status: 'active',
  });
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [currentOwner, setCurrentOwner] = useState(null);

  useEffect(() => {
    const fetchHotelDataAndOwners = async () => {
      try {
        setLoading(true);
        const hotelData = await api.adminHotel.getHotelById(id);
        setFormData({
          name: hotelData.name || '',
          ownerId: hotelData.ownerId?._id || '',
          description: hotelData.description || '',
          address: {
            number: hotelData.address?.number || '',
            street: hotelData.address?.street || '',
            city: hotelData.address?.city || '',
          },
          images: hotelData.images || [],
          starRating: hotelData.starRating || 1,
          contactInfo: {
            phone: hotelData.contactInfo?.phone || '',
            email: hotelData.contactInfo?.email || '',
          },
          policies: {
            checkInTime: hotelData.policies?.checkInTime || '14:00',
            checkOutTime: hotelData.policies?.checkOutTime || '12:00',
          },
          status: hotelData.status || 'active',
        });
        setPreviewImages(hotelData.images || []);
        setCurrentOwner(hotelData.ownerId);

        const users = await api.adminUser.getAllUsers();
        setOwners(users.filter(user => user.role === 'owner'));

        setError(null);
      } catch (err) {
        console.error("Error fetching hotel data or owners:", err);
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin khách sạn hoặc chủ khách sạn');
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDataAndOwners();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);
    const newPreviewImages = files.map(file => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...newPreviewImages]);
  };

  const handleRemoveImage = (indexToRemove, isExisting) => {
    if (isExisting) {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, index) => index !== indexToRemove),
      }));
      setPreviewImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    } else {
      setImageFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
      setPreviewImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const dataToSubmit = new FormData();
      dataToSubmit.append('name', formData.name);
      dataToSubmit.append('description', formData.description);
      dataToSubmit.append('starRating', formData.starRating);
      dataToSubmit.append('status', formData.status);
      dataToSubmit.append('address[number]', formData.address.number);
      dataToSubmit.append('address[street]', formData.address.street);
      dataToSubmit.append('address[city]', formData.address.city);
      dataToSubmit.append('contactInfo[phone]', formData.contactInfo.phone);
      dataToSubmit.append('contactInfo[email]', formData.contactInfo.email);
      dataToSubmit.append('policies[checkInTime]', formData.policies.checkInTime);
      dataToSubmit.append('policies[checkOutTime]', formData.policies.checkOutTime);
      imageFiles.forEach(file => {
        dataToSubmit.append('images', file);
      });
      formData.images.forEach(img => {
        dataToSubmit.append('images', img);
      });

      await api.adminHotel.updateHotel(id, dataToSubmit);
      navigate('/admin/hotels');
    } catch (err) {
      console.error("Error updating hotel:", err);
      setError(err.message || 'Có lỗi xảy ra khi cập nhật khách sạn');
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><div className="loading">Đang tải...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="hotel-edit-container">
        <h1>Chỉnh sửa khách sạn</h1>
        {error && <div className="error-message">{error}</div>}
        <form className="edit-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Tên khách sạn</label>
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
            <label htmlFor="address.number">Số nhà</label>
            <input
              type="text"
              id="address.number"
              name="address.number"
              value={formData.address.number}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="address.street">Đường</label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="address.city">Thành phố</label>
            <input
              type="text"
              id="address.city"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="contactInfo.phone">Số điện thoại</label>
            <input
              type="text"
              id="contactInfo.phone"
              name="contactInfo.phone"
              value={formData.contactInfo.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="contactInfo.email">Email</label>
            <input
              type="email"
              id="contactInfo.email"
              name="contactInfo.email"
              value={formData.contactInfo.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>
          <div className="form-group">
            <label>Chủ khách sạn</label>
            <div className="owner-info">
              {currentOwner ? (
                <div className="current-owner">
                  <p>{currentOwner.name}</p>
                  <p className="owner-email">{currentOwner.email}</p>
                </div>
              ) : (
                <p>Không có thông tin chủ khách sạn</p>
              )}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="starRating">Xếp hạng sao</label>
            <select
              id="starRating"
              name="starRating"
              value={formData.starRating}
              onChange={handleChange}
              required
            >
              <option value="1">1 sao</option>
              <option value="2">2 sao</option>
              <option value="3">3 sao</option>
              <option value="4">4 sao</option>
              <option value="5">5 sao</option>
            </select>
          </div>
          <div className="form-group-policies">
            <label>Chính sách</label>
            <div className="policies-inputs">
              <div className="policy-item">
                <input
                  type="time"
                  id="policies.checkInTime"
                  name="policies.checkInTime"
                  value={formData.policies.checkInTime}
                  onChange={handleChange}
                />
                <label htmlFor="policies.checkInTime">Giờ nhận phòng</label>
              </div>
              <div className="policy-item">
                <input
                  type="time"
                  id="policies.checkOutTime"
                  name="policies.checkOutTime"
                  value={formData.policies.checkOutTime}
                  onChange={handleChange}
                />
                <label htmlFor="policies.checkOutTime">Giờ trả phòng</label>
              </div>
            </div>
          </div>
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
              <option value="maintenance">Bảo trì</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="images">Ảnh khách sạn</label>
            <div className="image-upload-section">
              <div className="image-upload-button">
                <input
                  type="file"
                  id="images"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="images" className="upload-button">
                  Thêm ảnh mới
                </label>
              </div>
              <div className="image-previews">
                {formData.images.map((src, index) => (
                  <div key={`existing-${index}`} className="image-preview-item">
                    <img 
                      src={getImageUrl(src)} 
                      alt={`Existing ${index}`} 
                    />
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={() => handleRemoveImage(index, true)}
                    >
                      <span>×</span>
                    </button>
                  </div>
                ))}
                {imageFiles.map((file, index) => (
                  <div key={`new-${index}`} className="image-preview-item">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`New ${index}`} 
                    />
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={() => handleRemoveImage(index, false)}
                    >
                      <span>×</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button type="button" className="cancel-btn" onClick={() => navigate('/admin/hotels')}>Hủy</button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminHotelEditPage;

