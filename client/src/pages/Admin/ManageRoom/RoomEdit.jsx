import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../components/Admin/AdminLayout';
import api from '../../../apis';
import './RoomEdit.scss';

const RoomEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [hotels, setHotels] = useState([]);
  const [formData, setFormData] = useState({
    roomNumber: '',
    hotelId: '',
    type: 'standard',
    price: 500000,
    maxPeople: 2,
    description: '',
    facilities: [],
    images: [],
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [facilityInput, setFacilityInput] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [fetchingHotels, setFetchingHotels] = useState(true);
  const [fetchingRoom, setFetchingRoom] = useState(true);

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
    const fetchData = async () => {
      try {
        setFetchingHotels(true);
        const hotelsData = await api.adminHotel.getAllHotels();
        setHotels(hotelsData);

        setFetchingRoom(true);
        const roomData = await api.adminRoom.getRoomById(id);
        setFormData({
          roomNumber: roomData.roomNumber,
          hotelId: typeof roomData.hotelId === 'object' ? roomData.hotelId._id : roomData.hotelId,
          type: roomData.type,
          price: roomData.price.regular,
          maxPeople: roomData.maxPeople,
          description: roomData.description,
          facilities: roomData.facilities,
          status: roomData.status
        });
        setExistingImages(roomData.images);
      } catch (err) {
        setError('Không thể tải dữ liệu');
      } finally {
        setFetchingHotels(false);
        setFetchingRoom(false);
      }
    };

    fetchData();
  }, [id]);

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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(prev => [...prev, ...files]);
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.hotelId) {
      setError('Vui lòng chọn khách sạn');
      return;
    }
    
    try {
      setLoading(true);
      const submitData = new FormData();

      // Thêm các trường dữ liệu vào FormData
      submitData.append('hotelId', formData.hotelId);
      submitData.append('roomNumber', formData.roomNumber);
      submitData.append('type', formData.type);
      submitData.append('description', formData.description);
      submitData.append('maxPeople', formData.maxPeople);
      submitData.append('facilities', JSON.stringify(formData.facilities));
      submitData.append('status', formData.status);

      // Đảm bảo price là object {regular, discount}
      submitData.append('price', JSON.stringify({
        regular: formData.price,
        discount: formData.discount || 0
      }));

      // Thêm các ảnh hiện có
      submitData.append('existingImages', JSON.stringify(existingImages));

      // Thêm các file ảnh mới vào FormData
      selectedImages.forEach((image) => {
        submitData.append('images', image);
      });

      await api.adminRoom.updateRoom(id, submitData);
      navigate(`/admin/rooms/${id}`);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật phòng');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingHotels || fetchingRoom) return (
    <AdminLayout>
      <div className="admin-form-container">
        <div>Đang tải dữ liệu...</div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="admin-form-container">
        <h2>Chỉnh sửa phòng</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Khách sạn</label>
            <input
              type="text"
              value={
                typeof formData.hotelId === 'object'
                  ? formData.hotelId.name
                  : hotels.find(h => h._id === formData.hotelId)?.name || ''
              }
              disabled
              readOnly
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="roomNumber">Số phòng</label>
              <input
                type="text"
                id="roomNumber"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                placeholder="Ví dụ: 701"
                required
              />
            </div>
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
              <label htmlFor="status">Trạng thái phòng</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="active">Hoạt động</option>
                <option value="maintenance">Bảo trì</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
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
          
          <div className="facilities-container">
            <label>Tiện nghi phòng</label>
            <div className="facilities-list">
              {formData.facilities.map((facility, index) => (
                <div key={index} className="facility-tag">
                  {facility}
                  <button type="button" onClick={() => handleRemoveFacility(facility)}>×</button>
                </div>
              ))}
            </div>
            <div className="facility-input">
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
          </div>
          
          <div className="images-container">
            <label>Hình ảnh phòng</label>
            <div className="images-list">
              {existingImages.map((image, index) => (
                <div key={`existing-${index}`} className="image-item">
                  <img src={`${import.meta.env.VITE_API_URL}${image}`} alt={`Phòng ${index + 1}`} />
                  <button type="button" onClick={() => handleRemoveExistingImage(index)}>×</button>
                </div>
              ))}
              {selectedImages.map((image, index) => (
                <div key={`new-${index}`} className="image-item">
                  <img src={URL.createObjectURL(image)} alt={`Phòng ${index + 1}`} />
                  <button type="button" onClick={() => handleRemoveImage(index)}>×</button>
                </div>
              ))}
            </div>
            <div className="image-input">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật phòng'}
            </button>
            <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default RoomEdit;
