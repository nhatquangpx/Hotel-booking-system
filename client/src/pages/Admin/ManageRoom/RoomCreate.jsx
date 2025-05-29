import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { roomAPI, hotelAPI } from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';

const RoomCreate = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    hotelId: '',
    type: 'standard',
    price: 500000,
    maxPeople: 2,
    description: '',
    facilities: [],
    images: [],
    quantity: 1,
    available: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [facilityInput, setFacilityInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [fetchingHotels, setFetchingHotels] = useState(true);

  const roomTypes = [
    { value: 'standard', label: 'Phòng tiêu chuẩn' },
    { value: 'deluxe', label: 'Phòng cao cấp' },
    { value: 'suite', label: 'Phòng Suite' },
    { value: 'family', label: 'Phòng gia đình' },
    { value: 'executive', label: 'Phòng hạng sang' },
  ];

  const facilityOptions = [
    'TV', 'Wifi', 'Minibar', 'Điều hòa', 'Bồn tắm', 'Ban công', 
    'Két sắt', 'Bàn làm việc', 'Tủ lạnh', 'Máy pha cà phê'
  ];

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setFetchingHotels(true);
        const data = await hotelAPI.getAllHotels();
        setHotels(data);
        
        // Nếu có khách sạn, thiết lập khách sạn đầu tiên làm mặc định
        if (data && data.length > 0) {
          setFormData(prev => ({
            ...prev,
            hotelId: data[0]._id
          }));
        }
      } catch (err) {
        setError('Không thể tải danh sách khách sạn');
      } finally {
        setFetchingHotels(false);
      }
    };

    fetchHotels();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleAddFacility = () => {
    if (facilityInput && !formData.facilities.includes(facilityInput)) {
      setFormData(prev => ({
        ...prev,
        facilities: [...prev.facilities, facilityInput],
      }));
      setFacilityInput('');
    }
  };

  const handleRemoveFacility = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.filter(f => f !== facility),
    }));
  };

  const handleAddImage = () => {
    if (imageInput && !formData.images.includes(imageInput)) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageInput],
      }));
      setImageInput('');
    }
  };

  const handleRemoveImage = (image) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== image),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.hotelId) {
      setError('Vui lòng chọn khách sạn');
      return;
    }
    
    try {
      setLoading(true);
      await roomAPI.createRoom(formData);
      navigate('/admin/rooms');
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tạo phòng');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingHotels) return (
    <AdminLayout>
      <div>Đang tải danh sách khách sạn...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="admin-form-container">
        <h2>Thêm phòng mới</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="hotelId">Khách sạn</label>
            <select
              id="hotelId"
              name="hotelId"
              value={formData.hotelId}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn khách sạn --</option>
              {hotels.map(hotel => (
                <option key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="name">Tên phòng</label>
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
            <label htmlFor="type">Loại phòng</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              {roomTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Giá phòng (VND)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="50000"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="maxPeople">Số người tối đa</label>
              <input
                type="number"
                id="maxPeople"
                name="maxPeople"
                value={formData.maxPeople}
                onChange={handleChange}
                min="1"
                max="10"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="quantity">Số lượng phòng</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Tiện nghi phòng</label>
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
          
          <div className="form-group">
            <label>Hình ảnh phòng</label>
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
            <label htmlFor="available">Trạng thái</label>
            <select
              id="available"
              name="available"
              value={formData.available.toString()}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                available: e.target.value === 'true'
              }))}
              required
            >
              <option value="true">Có sẵn</option>
              <option value="false">Không có sẵn</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => navigate('/admin/rooms')} className="cancel-btn">
              Hủy
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo phòng'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default RoomCreate; 