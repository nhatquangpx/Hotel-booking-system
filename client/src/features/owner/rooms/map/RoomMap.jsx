import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomCard, RoomStatusLegend, RoomDetailModal } from '../components';
import { CreateRoomButton } from '../create';
import { EditRoomDialog } from '../edit';
import api from '@/apis';
import { useAuth } from '@/shared/hooks';
import { useOwnerHotel } from '../../context/OwnerHotelContext';
import OwnerGuideCollapsible from '@/features/owner/components/OwnerGuideCollapsible';
import './RoomMap.scss';

const normalizeRoomStatus = (room) => {
  if (room.roomStatus && room.bookingStatus) {
    return {
      ...room,
      roomStatus: room.roomStatus,
      bookingStatus: room.bookingStatus
    };
  }

  if (room.status) {
    if (['empty', 'occupied', 'pending'].includes(room.status)) {
      return {
        ...room,
        bookingStatus: room.status,
        roomStatus: 'active'
      };
    }
    if (['maintenance', 'inactive'].includes(room.status)) {
      return {
        ...room,
        bookingStatus: 'empty',
        roomStatus: room.status
      };
    }
  }

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

const RoomMap = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedHotelId, loading: hotelsLoading, hotels } = useOwnerHotel();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const editRoomManagerRef = useRef(null);

  const fetchRooms = useCallback(async () => {
    if (hotelsLoading) {
      return;
    }
    try {
      setLoading(true);
      setError(null);

      if (!hotels || hotels.length === 0) {
        setError('Bạn chưa có khách sạn nào. Vui lòng tạo khách sạn trước.');
        setRooms([]);
        setLoading(false);
        return;
      }

      if (!selectedHotelId) {
        setRooms([]);
        setLoading(false);
        return;
      }

      const roomsData = await api.ownerRoom.getHotelRooms(selectedHotelId);

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
  }, [selectedHotelId, hotelsLoading, hotels]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

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

  if (hotelsLoading || loading) {
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
        <OwnerGuideCollapsible label="Hướng dẫn sơ đồ phòng — bấm để xem">
          <div className="room-map__guide-card">
            <div className="room-map__guide-intro">
              <h3>Hướng dẫn quản lý sơ đồ phòng</h3>
              <p>
                Theo dõi tình trạng từng phòng ngay trên sơ đồ để xử lý nhanh trong ngày. Bạn có thể xem chi tiết,
                cập nhật thông tin hoặc đổi tình trạng phòng chỉ với vài thao tác.
              </p>
            </div>
            <div className="room-map__guide-grid">
              <div className="room-map__guide-item">
                <span className="room-map__guide-step">1</span>
                <div>
                  <strong>Xem nhanh tình trạng phòng</strong>
                  <p>Quan sát màu và chú thích để biết phòng đang trống, chờ khách hay đang có khách ở.</p>
                </div>
              </div>
              <div className="room-map__guide-item">
                <span className="room-map__guide-step">2</span>
                <div>
                  <strong>Tạo phòng mới khi cần</strong>
                  <p>Thêm phòng mới để cập nhật đầy đủ số lượng phòng đang kinh doanh tại khách sạn.</p>
                </div>
              </div>
              <div className="room-map__guide-item">
                <span className="room-map__guide-step">3</span>
                <div>
                  <strong>Nhấn vào phòng để xem chi tiết</strong>
                  <p>Mở thông tin phòng để kiểm tra giá, tiện nghi, hình ảnh và các thông tin liên quan.</p>
                </div>
              </div>
              <div className="room-map__guide-item">
                <span className="room-map__guide-step">4</span>
                <div>
                  <strong>Cập nhật khi có thay đổi</strong>
                  <p>Chỉnh sửa thông tin hoặc tình trạng phòng để sơ đồ luôn phản ánh đúng thực tế.</p>
                </div>
              </div>
            </div>
          </div>
        </OwnerGuideCollapsible>
        <div className="room-map__header-content">
          <p className="room-map__instruction">
            Nhấn vào phòng để xem chi tiết và thao tác
          </p>
          <CreateRoomButton onSuccess={fetchRooms} hotelId={selectedHotelId} />
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

