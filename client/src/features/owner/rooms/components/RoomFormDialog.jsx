import React, { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@/components/ui/Dialog';
import { getImageUrl } from '@/constants/images';
import api from '../../../../apis';
import './RoomFormDialog.scss';

const RoomFormDialog = ({ 
  isOpen, 
  onClose, 
  roomId = null,
  hotelId = null,
  onSuccess 
}) => {
  const isEdit = !!roomId;
  const [hotels, setHotels] = useState([]);
  const [formData, setFormData] = useState({
    roomNumber: '',
    hotelId: hotelId || '',
    type: 'standard',
    price: 500000,
    maxPeople: 2,
    description: '',
    facilities: [],
    roomStatus: 'active',
    bookingStatus: 'empty',
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [facilityInput, setFacilityInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    if (isOpen) {
      fetchHotels();
      if (isEdit) {
        fetchRoom();
      } else {
        // Reset form for create
        setFormData({
          roomNumber: '',
          hotelId: hotelId || '',
          type: 'standard',
          price: 500000,
          maxPeople: 2,
          description: '',
          facilities: [],
          roomStatus: 'active',
          bookingStatus: 'empty',
        });
        setSelectedImages([]);
        setExistingImages([]);
        setFacilityInput('');
        setError(null);
      }
    }
  }, [isOpen, roomId, hotelId]);

  const fetchHotels = async () => {
    try {
      const data = await api.ownerHotel.getOwnerHotels();
      setHotels(data);
      if (!isEdit && data && data.length > 0 && !hotelId) {
        setFormData(prev => ({
          ...prev,
          hotelId: data[0]._id
        }));
      }
    } catch (err) {
      setError('Không thể tải danh sách khách sạn');
    }
  };

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const roomData = await api.ownerRoom.getRoomById(roomId);
      setFormData({
        roomNumber: roomData.roomNumber || '',
        hotelId: roomData.hotelId?._id || roomData.hotelId || '',
        type: roomData.type || 'standard',
        price: roomData.price?.regular || roomData.price || 500000,
        maxPeople: roomData.maxPeople || 2,
        description: roomData.description || '',
        facilities: roomData.facilities || [],
        roomStatus: roomData.roomStatus || 'active',
        bookingStatus: roomData.bookingStatus || 'empty',
      });
      setExistingImages(roomData.images || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải thông tin phòng');
    } finally {
      setLoading(false);
    }
  };

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
      setSaving(true);
      setError(null);

      if (isEdit) {
        const submitData = new FormData();
        
        submitData.append('hotelId', formData.hotelId);
        submitData.append('roomNumber', formData.roomNumber);
        submitData.append('type', formData.type);
        submitData.append('description', formData.description);
        submitData.append('maxPeople', formData.maxPeople);
        submitData.append('facilities', JSON.stringify(formData.facilities));
        // Chỉ cho phép cập nhật roomStatus khi bookingStatus là empty
        if (formData.roomStatus && formData.bookingStatus === 'empty') {
          submitData.append('roomStatus', formData.roomStatus);
        }
        
        submitData.append('price', JSON.stringify({
          regular: formData.price,
          discount: 0
        }));
        
        submitData.append('existingImages', JSON.stringify(existingImages));
        
        selectedImages.forEach((image) => {
          submitData.append('images', image);
        });
        
        await api.ownerRoom.updateRoom(roomId, submitData);
      } else {
        const submitData = new FormData();
        Object.keys(formData).forEach(key => {
          if (key === 'facilities') {
            submitData.append(key, JSON.stringify(formData[key]));
          } else {
            submitData.append(key, formData[key]);
          }
        });
        selectedImages.forEach((image) => {
          submitData.append('images', image);
        });

        await api.ownerRoom.createRoom(formData.hotelId, submitData);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || `Có lỗi xảy ra khi ${isEdit ? 'cập nhật' : 'tạo'} phòng`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose}
      title={isEdit ? 'Chỉnh sửa phòng' : 'Tạo phòng mới'}
      maxWidth="800px"
      className="room-form-dialog"
    >
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <form className="room-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          {hotels.length > 1 && (
            <div className="form-group">
              <label htmlFor="hotelId">Khách sạn</label>
              <select
                id="hotelId"
                name="hotelId"
                value={formData.hotelId}
                onChange={handleChange}
                required
                disabled={!!hotelId}
              >
                <option value="">-- Chọn khách sạn --</option>
                {hotels.map(hotel => (
                  <option key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
          </div>

          {isEdit && (
            <div className="form-group">
              <label>Trạng thái đặt phòng (chỉ đọc)</label>
              <div className="readonly-status">
                {formData.bookingStatus === 'empty' ? 'Trống' : 
                 formData.bookingStatus === 'occupied' ? 'Đang ở' : 
                 formData.bookingStatus === 'pending' ? 'Chờ nhận' : 'Trống'}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="roomStatus">Trạng thái phòng</label>
            {isEdit && formData.bookingStatus !== 'empty' ? (
              <>
                <div className="readonly-status">
                  {formData.roomStatus === 'active' ? 'Hoạt động' : 
                   formData.roomStatus === 'maintenance' ? 'Bảo trì' : 'Tạm ngưng'}
                </div>
                <p className="status-note">
                  Không thể thay đổi trạng thái phòng khi phòng đang {formData.bookingStatus === 'occupied' ? 'có khách' : 'chờ nhận'}
                </p>
              </>
            ) : (
              <select
                id="roomStatus"
                name="roomStatus"
                value={formData.roomStatus}
                onChange={handleChange}
                required
              >
                <option value="active">Hoạt động</option>
                <option value="maintenance">Bảo trì</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            )}
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
              {isEdit && existingImages.map((image, index) => (
                <div key={`existing-${index}`} className="image-item">
                  <img 
                    src={getImageUrl(image)} 
                    alt={`Phòng ${index + 1}`}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x150?text=Image+Error';
                    }}
                  />
                  <IconButton 
                    className="remove-image-btn"
                    onClick={() => handleRemoveExistingImage(index)}
                    size="small"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </div>
              ))}
              {selectedImages.map((image, index) => (
                <div key={`new-${index}`} className="image-item">
                  <img src={URL.createObjectURL(image)} alt={`Phòng ${index + 1}`} />
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
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? (isEdit ? 'Đang lưu...' : 'Đang tạo...') : (isEdit ? 'Lưu thay đổi' : 'Tạo phòng')}
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

export default RoomFormDialog;

