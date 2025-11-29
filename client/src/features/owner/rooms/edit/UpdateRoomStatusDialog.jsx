import React, { useState, useEffect } from 'react';
import Dialog from '@/components/ui/Dialog';
import api from '@/apis';
import './UpdateRoomStatusDialog.scss';

const UpdateRoomStatusDialog = ({ room, isOpen, onClose, onSuccess }) => {
  const [selectedRoomStatus, setSelectedRoomStatus] = useState(room?.roomStatus || 'active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && room) {
      setSelectedRoomStatus(room.roomStatus || 'active');
      setError(null);
    }
  }, [isOpen, room]);

  const roomStatusOptions = [
    { value: 'active', label: 'Hoạt động' },
    { value: 'maintenance', label: 'Bảo trì' },
    { value: 'inactive', label: 'Tạm ngưng' }
  ];

  const bookingStatusLabels = {
    'empty': 'Trống',
    'occupied': 'Đang ở',
    'pending': 'Chờ nhận'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!room?._id) {
      setError('Không tìm thấy thông tin phòng');
      return;
    }

    // Kiểm tra bookingStatus: chỉ cho phép thay đổi roomStatus khi bookingStatus là 'empty'
    if (room.bookingStatus !== 'empty') {
      setError('Chỉ có thể thay đổi trạng thái phòng khi phòng đang trống (empty)');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updateData = new FormData();
      updateData.append('roomStatus', selectedRoomStatus);
      updateData.append('roomNumber', room.roomNumber);
      updateData.append('type', room.type);
      updateData.append('description', room.description || '');
      updateData.append('maxPeople', room.maxPeople || 2);
      updateData.append('facilities', JSON.stringify(room.facilities || []));
      
      if (room.price) {
        updateData.append('price', JSON.stringify({
          regular: room.price.regular || room.price || 0,
          discount: room.price.discount || 0
        }));
      }

      if (room.images && room.images.length > 0) {
        updateData.append('existingImages', JSON.stringify(room.images));
      }

      await api.ownerRoom.updateRoom(room._id, updateData);
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Cập nhật trạng thái phòng"
      maxWidth="500px"
      className="update-room-status-dialog"
    >
      <form className="update-status-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}

        {room && (
          <div className="form-group">
            <label>Trạng thái đặt phòng (chỉ đọc)</label>
            <div className="readonly-status">
              {bookingStatusLabels[room.bookingStatus] || room.bookingStatus || 'Trống'}
            </div>
            {room.bookingStatus !== 'empty' && (
              <p className="status-note">
                Không thể thay đổi trạng thái phòng khi phòng đang {bookingStatusLabels[room.bookingStatus]?.toLowerCase() || 'có khách'}
              </p>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="roomStatus">Trạng thái phòng</label>
          <select
            id="roomStatus"
            value={selectedRoomStatus}
            onChange={(e) => setSelectedRoomStatus(e.target.value)}
            required
            disabled={room?.bookingStatus !== 'empty'}
          >
            {roomStatusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={saving}>
            {saving ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
          <button type="button" className="cancel-btn" onClick={onClose}>
            Hủy
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export default UpdateRoomStatusDialog;

