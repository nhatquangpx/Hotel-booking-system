import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Dialog from '@/components/ui/Dialog';
import { apiErrorMessage } from '@/shared/utils';
import api from '@/apis';
import '@/features/owner/rooms/edit/UpdateRoomStatusDialog.scss';

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
    { value: 'inactive', label: 'Tạm ngưng' },
  ];

  const bookingStatusLabels = {
    empty: 'Trống',
    occupied: 'Đang ở',
    pending: 'Chờ nhận',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!room?._id) {
      setError('Không tìm thấy thông tin phòng');
      return;
    }

    if (room.bookingStatus !== 'empty') {
      setError('Chỉ có thể thay đổi trạng thái phòng khi phòng đang trống (empty)');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.staffRoom.updateRoomStatus(room._id, selectedRoomStatus);
      onSuccess?.();
      onClose();
      toast.success('Cập nhật trạng thái phòng thành công');
    } catch (err) {
      const msg = apiErrorMessage(err, 'Có lỗi xảy ra khi cập nhật trạng thái');
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
                Không thể thay đổi trạng thái phòng khi phòng đang{' '}
                {bookingStatusLabels[room.bookingStatus]?.toLowerCase() || 'có khách'}
              </p>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="staff-roomStatus">Trạng thái phòng</label>
          <select
            id="staff-roomStatus"
            value={selectedRoomStatus}
            onChange={(e) => setSelectedRoomStatus(e.target.value)}
            required
            disabled={room?.bookingStatus !== 'empty'}
          >
            {roomStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={saving || room?.bookingStatus !== 'empty'}>
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
