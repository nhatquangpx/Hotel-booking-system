import React, { useState, useEffect } from 'react';
import Dialog from '@/components/ui/Dialog';
import { ownerHotelAPI } from '@/apis/owner/hotel';
import { getImageUrl } from '@/constants/images';
import './EditHotelDialog.scss';

/**
 * EditHotelDialog Component
 * Dialog form for editing hotel information
 */
const EditHotelDialog = ({ isOpen, onClose, hotel, onSuccess }) => {
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
    policies: {
      checkInTime: '14:00',
      checkOutTime: '12:00'
    }
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && hotel) {
      setFormData({
        name: hotel.name || '',
        description: hotel.description || '',
        address: {
          number: hotel.address?.number || '',
          street: hotel.address?.street || '',
          city: hotel.address?.city || ''
        },
        contactInfo: {
          phone: hotel.contactInfo?.phone || '',
          email: hotel.contactInfo?.email || ''
        },
        starRating: hotel.starRating || 3,
        policies: {
          checkInTime: hotel.policies?.checkInTime || '14:00',
          checkOutTime: hotel.policies?.checkOutTime || '12:00'
        }
      });
      setExistingImages(hotel.images || []);
      setImagePreviews(hotel.images?.map(img => getImageUrl(img)) || []);
      setSelectedFiles([]);
      setError(null);
    }
  }, [isOpen, hotel]);

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
        [name]: name === 'starRating' ? parseInt(value) : value
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

      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('starRating', formData.starRating);
      submitData.append('address[number]', formData.address.number);
      submitData.append('address[street]', formData.address.street);
      submitData.append('address[city]', formData.address.city);
      submitData.append('contactInfo[phone]', formData.contactInfo.phone);
      submitData.append('contactInfo[email]', formData.contactInfo.email);
      submitData.append('policies[checkInTime]', formData.policies.checkInTime);
      submitData.append('policies[checkOutTime]', formData.policies.checkOutTime);
      submitData.append('existingImages', JSON.stringify(existingImages));

      // Thêm ảnh mới nếu có
      selectedFiles.forEach((file) => {
        submitData.append('images', file);
      });

      await ownerHotelAPI.updateHotel(hotel._id, submitData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật thông tin khách sạn');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa thông tin khách sạn"
      maxWidth="800px"
      className="edit-hotel-dialog"
    >
      <form className="edit-hotel-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="name">Tên khách sạn *</label>
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
          <label htmlFor="description">Mô tả *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="address.number">Số nhà *</label>
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
            <label htmlFor="address.street">Đường *</label>
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
            <label htmlFor="address.city">Thành phố *</label>
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
            <label htmlFor="contactInfo.phone">Số điện thoại *</label>
            <input
              type="tel"
              id="contactInfo.phone"
              name="contactInfo.phone"
              value={formData.contactInfo.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="contactInfo.email">Email *</label>
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
            <label htmlFor="starRating">Hạng sao *</label>
            <select
              id="starRating"
              name="starRating"
              value={formData.starRating}
              onChange={handleChange}
              required
            >
              <option value={1}>1 sao</option>
              <option value={2}>2 sao</option>
              <option value={3}>3 sao</option>
              <option value={4}>4 sao</option>
              <option value={5}>5 sao</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="policies.checkInTime">Giờ check-in *</label>
            <input
              type="time"
              id="policies.checkInTime"
              name="policies.checkInTime"
              value={formData.policies.checkInTime}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="policies.checkOutTime">Giờ check-out *</label>
            <input
              type="time"
              id="policies.checkOutTime"
              name="policies.checkOutTime"
              value={formData.policies.checkOutTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

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
          <div className="image-previews">
            {imagePreviews.map((src, index) => (
              <div key={index} className="image-preview-item">
                <img src={src} alt={`Preview ${index}`} />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => handleRemoveImage(index)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn-cancel">
            Hủy
          </button>
          <button type="submit" className="btn-submit" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export default EditHotelDialog;
