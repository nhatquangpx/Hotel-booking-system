import React, { useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import api from '@/apis';
import './DeleteRoomDialog.scss';

const DeleteRoomDialog = ({ room, isOpen, onClose, onSuccess }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    if (!room?._id) {
      setError('Không tìm thấy thông tin phòng');
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      await api.ownerRoom.deleteRoom(room._id);
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi xóa phòng');
    } finally {
      setDeleting(false);
    }
  };

  if (!room) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Xóa phòng"
      maxWidth="500px"
      className="delete-room-dialog"
    >
      <div className="delete-room-content">
        {error && <div className="error-message">{error}</div>}

        <div className="delete-room-warning">
          <p className="warning-text">
            Bạn có chắc chắn muốn xóa phòng <strong>{room.roomNumber}</strong>?
          </p>
          <p className="warning-note">
            Hành động này không thể hoàn tác. Tất cả thông tin về phòng này sẽ bị xóa vĩnh viễn.
          </p>
          {room.bookingStatus !== 'empty' && (
            <p className="warning-error">
              ⚠️ Phòng đang {room.bookingStatus === 'occupied' ? 'có khách' : 'chờ nhận'}. 
              Không thể xóa phòng khi đang có đặt phòng.
            </p>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="delete-btn" 
            onClick={handleDelete}
            disabled={deleting || room.bookingStatus !== 'empty'}
          >
            {deleting ? 'Đang xóa...' : 'Xóa phòng'}
          </button>
          <button type="button" className="cancel-btn" onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default DeleteRoomDialog;

