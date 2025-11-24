import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoomCard from './RoomCard';
import RoomStatusLegend from './RoomStatusLegend';
import RoomDetailModal from './RoomDetailModal';
import api from '@/apis';
import { useAuth } from '@/shared/hooks';
import './RoomMap.scss';

/**
 * Room Map Component
 * Main component displaying the room map grid
 */
const RoomMap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get the owner's hotels
      const hotels = await api.ownerHotel.getOwnerHotels();
      
      if (!hotels || hotels.length === 0) {
        setError('Bạn chưa có khách sạn nào. Vui lòng tạo khách sạn trước.');
        setLoading(false);
        return;
      }

      // Get rooms from the first hotel (or you can add hotel selection later)
      const hotelId = hotels[0]._id || hotels[0].id;
      const roomsData = await api.ownerRoom.getHotelRooms(hotelId);

      // Transform room data to include status and guest info
      // In a real app, this would come from the API based on bookings
      const roomsWithStatus = roomsData.map(room => ({
        ...room,
        status: room.status || determineRoomStatus(room),
        guestName: room.currentGuest || null
      }));

      setRooms(roomsWithStatus);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine room status
  // In a real app, this would be calculated based on bookings
  const determineRoomStatus = (room) => {
    // This is a placeholder - in reality, you'd check bookings
    if (room.available === false) return 'maintenance';
    // You would check if there's an active booking
    return 'empty';
  };

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  const handleEditRoom = (room) => {
    // Navigate to edit page or open edit modal
    // For now, just log it
    console.log('Edit room:', room);
    // You can navigate to edit page: navigate(`/owner/rooms/${room._id}/edit`);
  };

  if (loading) {
    return (
      <div className="room-map-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải sơ đồ phòng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-map-error">
        <p className="error-message">{error}</p>
        <button onClick={fetchRooms} className="retry-button">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="room-map">
      <div className="room-map__header">
        <h2 className="room-map__title">Sơ đồ phòng</h2>
        <p className="room-map__instruction">
          Nhấn vào phòng để xem chi tiết và thao tác
        </p>
      </div>

      <RoomStatusLegend />

      <div className="room-map__grid">
        {rooms.length === 0 ? (
          <div className="room-map__empty">
            <p>Chưa có phòng nào. Vui lòng tạo phòng mới.</p>
          </div>
        ) : (
          rooms.map((room) => (
            <RoomCard
              key={room._id || room.id}
              room={room}
              onClick={() => handleRoomClick(room)}
            />
          ))
        )}
      </div>

      <RoomDetailModal
        room={selectedRoom}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEdit={handleEditRoom}
      />
    </div>
  );
};

export default RoomMap;

