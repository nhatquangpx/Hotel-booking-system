import React, { useState, useEffect } from 'react';
import Dialog from '@/components/ui/Dialog';
import api from '@/apis';
import './UpdateRoomStatusDialog.scss';

const UpdateRoomStatusDialog = ({ room, isOpen, onClose, onSuccess }) => {
  const [selectedStatus, setSelectedStatus] = useState(room?.status || 'empty');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && room) {
      setSelectedStatus(room.status || 'empty');
      setError(null);
    }
  }, [isOpen, room]);

  const statusOptions = [
    { value: 'empty', label: 'Trống' },
    { value: 'occupied', label: 'Đang ở' },
    { value: 'pending', label: 'Chờ nhận' },
    { value: 'maintenance', label: 'Bảo trì' },
    { value: 'inactive', label: 'Tạm ngưng' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!room?._id) {
      setError('Không tìm thấy thông tin phòng');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updateData = new FormData();
      updateData.append('status', selectedStatus);
      updateData.append('roomNumber', room.roomNumber);
      updateData.append('type', room.type);
      updateData.append('description', room.description || '');
      updateData.append('maxPeople', room.maxPeople || 2);
      updateData.append('facilities', JSON.stringify(room.facilities || []));
      updateData.append('available', selectedStatus === 'empty' || selectedStatus === 'occupied' || selectedStatus === 'pending');
      
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

        <div className="form-group">
          <label htmlFor="status">Trạng thái phòng</label>
          <select
            id="status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            required
          >
            {statusOptions.map(option => (
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

