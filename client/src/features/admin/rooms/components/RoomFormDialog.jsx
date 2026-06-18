import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@/components/ui/Dialog';
import RoomFacilitiesPicker from '@/components/rooms/RoomFacilitiesPicker';
import api from '../../../../apis';
import { getRoomPrice, apiErrorMessage, normalizeRoomStatus } from '@/shared/utils';
import { getImageUrl } from '../../../../constants/images';
import './RoomFormDialog.scss';

/**
 * Room Form Dialog Component
 * Reusable dialog for creating and editing rooms
 */
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
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
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
        });
        setSelectedImages([]);
        setExistingImages([]);
        setError(null);
      }
    }
  }, [isOpen, roomId, hotelId]);

  const fetchHotels = async () => {
    try {
      const result = await api.adminHotel.getAllHotels({ all: true });
      const data = result.items || [];
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
      const roomData = await api.adminRoom.getRoomById(roomId);
      setFormData({
        roomNumber: roomData.roomNumber || '',
        hotelId: roomData.hotelId?._id || roomData.hotelId || '',
        type: roomData.type || 'standard',
        price: getRoomPrice(roomData.price) || 500000,
        maxPeople: roomData.maxPeople || 2,
        description: roomData.description || '',
        facilities: roomData.facilities || [],
        roomStatus: normalizeRoomStatus(roomData).roomStatus,
      });
      setExistingImages(roomData.images || []);
      setSelectedImages([]);
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

  const handleFacilitiesChange = (facilities) => {
    setFormData((prev) => ({ ...prev, facilities }));
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
        submitData.append('roomStatus', formData.roomStatus);
        submitData.append('price', String(formData.price));
        submitData.append('existingImages', JSON.stringify(existingImages));
        selectedImages.forEach((image) => {
          submitData.append('images', image);
        });
        await api.adminRoom.updateRoom(roomId, submitData);
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

        await api.adminRoom.createRoom(submitData);
      }

      onSuccess?.();
      onClose();
      toast.success(isEdit ? 'Cập nhật phòng thành công' : 'Tạo phòng thành công');
    } catch (err) {
      const msg = apiErrorMessage(err, `Có lỗi xảy ra khi ${isEdit ? 'cập nhật' : 'tạo'} phòng`);
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
      title={isEdit ? 'Chỉnh sửa phòng' : 'Tạo phòng mới'}
      maxWidth="800px"
      className="room-form-dialog"
    >
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <form className="room-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

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
            {isEdit && (
              <div className="form-group">
                <label htmlFor="roomStatus">Trạng thái phòng</label>
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
              </div>
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

          <RoomFacilitiesPicker
            facilities={formData.facilities}
            onChange={handleFacilitiesChange}
          />

          <div className="images-container">
            <label>Hình ảnh phòng</label>
            <div className="images-list">
              {existingImages.map((image, index) => (
                <div key={`existing-${index}`} className="image-item">
                  <img src={getImageUrl(image)} alt={`Phòng ${index + 1}`} />
                  {isEdit && (
                    <IconButton
                      className="remove-image-btn"
                      onClick={() => handleRemoveExistingImage(index)}
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
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

