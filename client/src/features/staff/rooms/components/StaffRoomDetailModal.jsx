import React, { useState, useEffect } from 'react';
import { FaTimes, FaSyncAlt } from 'react-icons/fa';
import api from '@/apis';
import UpdateRoomStatusDialog from '../edit/UpdateRoomStatusDialog';
import StaffRoomDetailContent from './StaffRoomDetailContent';
import '@/features/owner/rooms/components/RoomDetailModal.scss';

const StaffRoomDetailModal = ({ room, isOpen, onClose, onStatusUpdate }) => {
  const [roomDetails, setRoomDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen && room?._id) {
      fetchRoomDetails();
    }
  }, [isOpen, room?._id]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const details = await api.staffRoom.getRoomById(room._id);
      setRoomDetails(details);
    } catch (error) {
      console.error('Error fetching room details:', error);
      setRoomDetails(room);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const roomData = roomDetails || room;
  if (!roomData) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleStatusSuccess = () => {
    fetchRoomDetails();
    onStatusUpdate?.();
  };

  return (
    <>
      <div className="room-detail-modal-overlay" onClick={handleBackdropClick}>
        <div className="room-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="room-detail-modal__header">
            <div className="room-detail-modal__header-top">
              <h2 className="room-detail-modal__title">Phòng {roomData.roomNumber}</h2>
              <button
                type="button"
                className="room-detail-modal__close-btn"
                onClick={onClose}
                title="Đóng"
              >
                <FaTimes />
              </button>
            </div>
            <div className="room-detail-modal__header-actions">
              <button
                type="button"
                className="room-detail-modal__action-btn-header"
                onClick={() => setIsStatusDialogOpen(true)}
                title="Cập nhật trạng thái"
              >
                <FaSyncAlt />
                <span>Cập nhật trạng thái</span>
              </button>
            </div>
          </div>

          <div className="room-detail-modal__content">
            <StaffRoomDetailContent roomData={roomData} loading={loading} />
          </div>
        </div>
      </div>

      <UpdateRoomStatusDialog
        room={roomData}
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        onSuccess={handleStatusSuccess}
      />
    </>
  );
};

export default StaffRoomDetailModal;
