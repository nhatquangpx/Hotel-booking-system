import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomCard, RoomStatusLegend, RoomDetailModal } from '../components';
import { CreateRoomButton } from '../create';
import { EditRoomDialog } from '../edit';
import api from '@/apis';
import { useAuth } from '@/shared/hooks';
import './RoomMap.scss';

const RoomMap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const editRoomManagerRef = useRef(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      const hotels = await api.ownerHotel.getOwnerHotels();
      
      if (!hotels || hotels.length === 0) {
        setError('Bạn chưa có khách sạn nào. Vui lòng tạo khách sạn trước.');
        setLoading(false);
        return;
      }

      const hotelId = hotels[0]._id || hotels[0].id;
      const roomsData = await api.ownerRoom.getHotelRooms(hotelId);

      const roomsWithStatus = roomsData.map(room => {
        const normalized = normalizeRoomStatus(room);
        return {
          ...normalized,
          guestName: room.currentGuest || null
        };
      });

      const sortedRooms = roomsWithStatus.sort((a, b) => {
        const roomNumberA = a.roomNumber || '';
        const roomNumberB = b.roomNumber || '';
        
        const numA = parseInt(roomNumberA) || 0;
        const numB = parseInt(roomNumberB) || 0;
        
        if (numA !== numB) {
          return numA - numB;
        }
        
        return roomNumberA.localeCompare(roomNumberB);
      });

      setRooms(sortedRooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const normalizeRoomStatus = (room) => {
    // Nếu đã có roomStatus và bookingStatus, giữ nguyên
    if (room.roomStatus && room.bookingStatus) {
      return {
        ...room,
        roomStatus: room.roomStatus,
        bookingStatus: room.bookingStatus
      };
    }
    
    // Fallback cho dữ liệu cũ
    if (room.status) {
      // Kiểm tra xem status cũ thuộc loại nào
      if (['empty', 'occupied', 'pending'].includes(room.status)) {
        return {
          ...room,
          bookingStatus: room.status,
          roomStatus: 'active'
        };
      } else if (['maintenance', 'inactive'].includes(room.status)) {
        return {
          ...room,
          bookingStatus: 'empty',
          roomStatus: room.status
        };
      }
    }
    
    // Fallback mặc định
    if (room.available === false) {
      return {
        ...room,
        bookingStatus: 'empty',
        roomStatus: 'maintenance'
      };
    }
    
    if (room.currentGuest) {
      return {
        ...room,
        bookingStatus: 'occupied',
        roomStatus: 'active'
      };
    }
    
    return {
      ...room,
      bookingStatus: 'empty',
      roomStatus: 'active'
    };
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
    setIsModalOpen(false);
    editRoomManagerRef.current?.handleEditRoom(room);
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
        <div className="room-map__header-content">
          <p className="room-map__instruction">
            Nhấn vào phòng để xem chi tiết và thao tác
          </p>
          <CreateRoomButton onSuccess={fetchRooms} />
        </div>
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
        onStatusUpdate={fetchRooms}
        onDeleteSuccess={handleCloseModal}
      />

      <EditRoomDialog
        ref={editRoomManagerRef}
        onSuccess={fetchRooms}
      />
    </div>
  );
};

export default RoomMap;

