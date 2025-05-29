import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { hotelAPI } from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';

const HotelCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'hotel',
    address: '',
    city: '',
    description: '',
    rating: 3,
    featuredImage: '',
    images: [],
    facilities: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [facilityInput, setFacilityInput] = useState('');
  const [imageInput, setImageInput] = useState('');

  const facilityOptions = [
    'Wifi', 'Hồ bơi', 'Bãi đỗ xe', 'Phòng gym', 
    'Nhà hàng', 'Spa', 'Điều hòa', 'Phòng họp', 
    'Dịch vụ phòng'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddFacility = () => {
    if (facilityInput && !formData.facilities.includes(facilityInput)) {
      setFormData((prev) => ({
        ...prev,
        facilities: [...prev.facilities, facilityInput],
      }));
      setFacilityInput('');
    }
  };

  const handleRemoveFacility = (facility) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.filter(f => f !== facility),
    }));
  };

  const handleAddImage = () => {
    if (imageInput && !formData.images.includes(imageInput)) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageInput],
      }));
      setImageInput('');
    }
  };

  const handleRemoveImage = (image) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter(img => img !== image),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await hotelAPI.createHotel(formData);
      navigate('/admin/hotels');
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tạo khách sạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-form-container">
        <h2>Thêm khách sạn mới</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
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
            <label htmlFor="type">Loại hình</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="hotel">Khách sạn</option>
              <option value="resort">Resort</option>
              <option value="homestay">Homestay</option>
              <option value="apartment">Căn hộ</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Địa chỉ</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="city">Thành phố</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="rating">Xếp hạng (1-5 sao)</label>
            <input
              type="number"
              id="rating"
              name="rating"
              min="1"
              max="5"
              value={formData.rating}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="featuredImage">Ảnh đại diện</label>
            <input
              type="text"
              id="featuredImage"
              name="featuredImage"
              value={formData.featuredImage}
              onChange={handleChange}
              placeholder="URL ảnh đại diện"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Ảnh khách sạn</label>
            <div className="input-group">
              <input
                type="text"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="URL ảnh"
              />
              <button type="button" onClick={handleAddImage}>Thêm</button>
            </div>
            <div className="tags-container">
              {formData.images.map((image, index) => (
                <div key={index} className="tag">
                  <span>{image.slice(0, 30)}...</span>
                  <button type="button" onClick={() => handleRemoveImage(image)}>×</button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label>Tiện nghi</label>
            <div className="input-group">
              <select
                value={facilityInput}
                onChange={(e) => setFacilityInput(e.target.value)}
              >
                <option value="">-- Chọn tiện nghi --</option>
                {facilityOptions.map((facility, index) => (
                  <option key={index} value={facility}>{facility}</option>
                ))}
              </select>
              <button type="button" onClick={handleAddFacility}>Thêm</button>
            </div>
            <div className="tags-container">
              {formData.facilities.map((facility, index) => (
                <div key={index} className="tag">
                  <span>{facility}</span>
                  <button type="button" onClick={() => handleRemoveFacility(facility)}>×</button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => navigate('/admin/hotels')} className="cancel-btn">
              Hủy
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo khách sạn'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default HotelCreate; 