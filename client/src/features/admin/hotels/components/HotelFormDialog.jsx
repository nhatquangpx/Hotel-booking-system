import React, { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@/components/ui/Dialog';
import api from '../../../../apis';
import { getImageUrl } from '../../../../constants/images';
import './HotelFormDialog.scss';

/**
 * Hotel Form Dialog Component
 * Reusable dialog for creating and editing hotels
 */
const HotelFormDialog = ({ 
  isOpen, 
  onClose, 
  hotelId = null, 
  onSuccess 
}) => {
  const isEdit = !!hotelId;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: {
      number: '',
      street: '',
      city: ''
    },
    contactInfo: {
      phone: '',
      email: ''
    },
    starRating: 3,
    ownerId: '',
    status: 'active',
    policies: {
      checkInTime: '14:00',
      checkOutTime: '12:00'
    }
  });
  const [owners, setOwners] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchOwners();
      if (isEdit) {
        fetchHotel();
      } else {
        // Reset form for create
        setFormData({
          name: '',
          description: '',
          address: {
            number: '',
            street: '',
            city: ''
          },
          contactInfo: {
            phone: '',
            email: ''
          },
          starRating: 3,
          ownerId: '',
          status: 'active',
          policies: {
            checkInTime: '14:00',
            checkOutTime: '12:00'
          }
        });
        setSelectedFiles([]);
        setImagePreviews([]);
        setExistingImages([]);
        setError(null);
      }
    }
  }, [isOpen, hotelId]);

  const fetchOwners = async () => {
    try {
      const users = await api.adminUser.getAllUsers();
      setOwners(users.filter(u => u.role === 'owner'));
    } catch (err) {
      setOwners([]);
    }
  };

  const fetchHotel = async () => {
    try {
      setLoading(true);
      const hotelData = await api.adminHotel.getHotelById(hotelId);
      setFormData({
        name: hotelData.name || '',
        ownerId: hotelData.ownerId?._id || hotelData.ownerId || '',
        description: hotelData.description || '',
        address: {
          number: hotelData.address?.number || '',
          street: hotelData.address?.street || '',
          city: hotelData.address?.city || '',
        },
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
      setExistingImages(hotelData.images || []);
      setImagePreviews(hotelData.images?.map(img => getImageUrl(img)) || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải thông tin khách sạn');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    // Check if it's a new file or existing image
    const existingCount = existingImages.length;
    if (index < existingCount) {
      // Remove existing image
      setExistingImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove new file
      const newIndex = index - existingCount;
      setSelectedFiles(prev => prev.filter((_, i) => i !== newIndex));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      if (isEdit) {
        // For edit, send as JSON
        const updateData = {
          ...formData,
          images: existingImages
        };
        await api.adminHotel.updateHotel(hotelId, updateData);
      } else {
        // For create, send as FormData
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('starRating', formData.starRating);
        formDataToSend.append('ownerId', formData.ownerId);
        formDataToSend.append('status', formData.status);
        formDataToSend.append('address[number]', formData.address.number);
        formDataToSend.append('address[street]', formData.address.street);
        formDataToSend.append('address[city]', formData.address.city);
        formDataToSend.append('contactInfo[phone]', formData.contactInfo.phone);
        formDataToSend.append('contactInfo[email]', formData.contactInfo.email);
        formDataToSend.append('policies[checkInTime]', formData.policies.checkInTime);
        formDataToSend.append('policies[checkOutTime]', formData.policies.checkOutTime);
        selectedFiles.forEach((file) => {
          formDataToSend.append('images', file);
        });

        await api.adminHotel.createHotel(formDataToSend);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || `Có lỗi xảy ra khi ${isEdit ? 'cập nhật' : 'tạo'} khách sạn`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa khách sạn' : 'Tạo khách sạn mới'}
      maxWidth="700px"
      className="hotel-form-dialog"
    >
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <form className="hotel-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

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

          <div className="form-row">
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
          </div>

          <div className="form-row">
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

          <div className="form-row">
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
            <div className="form-group">
              <label htmlFor="ownerId">Chủ khách sạn</label>
              <select
                id="ownerId"
                name="ownerId"
                value={formData.ownerId}
                onChange={handleChange}
                required
              >
                <option value="">-- Chọn chủ khách sạn --</option>
                {owners.map(owner => (
                  <option key={owner._id} value={owner._id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>
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
          </div>

          {!isEdit && (
            <div className="form-group">
              <label htmlFor="images">Ảnh khách sạn</label>
              <input
                type="file"
                id="images"
                name="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreviews.length > 0 && (
                <div className="image-previews">
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={src} alt={`Preview ${index}`} />
                      <IconButton 
                        className="remove-image-btn"
                        onClick={() => handleRemoveImage(index)}
                        size="small"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? (isEdit ? 'Đang lưu...' : 'Đang tạo...') : (isEdit ? 'Lưu thay đổi' : 'Tạo khách sạn')}
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

export default HotelFormDialog;

