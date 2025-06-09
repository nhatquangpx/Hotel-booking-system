import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AdminLayout from '../../../components/Admin/AdminLayout';
import api from '../../../apis';
import './HotelCreate.scss';

const HotelCreate = () => {
  const navigate = useNavigate();
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
  });
  const [owners, setOwners] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Lấy danh sách chủ khách sạn (role owner)
    const fetchOwners = async () => {
      try {
        const users = await api.adminUser.getAllUsers();
        setOwners(users.filter(u => u.role === 'owner'));
      } catch (err) {
        setOwners([]);
      }
    };
    fetchOwners();
  }, []);

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
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const formDataToSend = new FormData();
      
      // Gửi các trường đơn giản
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('starRating', formData.starRating);
      formDataToSend.append('ownerId', formData.ownerId);
      formDataToSend.append('status', formData.status);

      // Gửi các trường lồng nhau
      formDataToSend.append('address[number]', formData.address.number);
      formDataToSend.append('address[street]', formData.address.street);
      formDataToSend.append('address[city]', formData.address.city);
      
      formDataToSend.append('contactInfo[phone]', formData.contactInfo.phone);
      formDataToSend.append('contactInfo[email]', formData.contactInfo.email);

      // Gửi ảnh
      selectedFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      await api.adminHotel.createHotel(formDataToSend);
      navigate('/admin/hotels');
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tạo khách sạn mới');
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="hotel-create-container">
        <h1>Thêm khách sạn mới</h1>
        {error && <div className="error-message">{error}</div>}
        <form className="create-form" onSubmit={handleSubmit}>
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
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => navigate('/admin/hotels')}>Hủy</button>
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? 'Đang tạo...' : 'Tạo khách sạn'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default HotelCreate; 