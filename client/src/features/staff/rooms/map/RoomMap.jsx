import React, { useState, useEffect, useCallback } from 'react';
import { RoomCard, RoomStatusLegend } from '@/features/owner/rooms/components';
import OwnerGuideCollapsible from '@/features/owner/components/OwnerGuideCollapsible';
import { StaffRoomDetailModal } from '../components';
import api from '@/apis';
import { useStaffHotel } from '../../context/StaffHotelContext';
import { normalizeRoomStatus, sortRoomsByNumber } from '../utils/normalizeRoomStatus';
import '@/features/owner/rooms/map/RoomMap.scss';
import './StaffRoomMap.scss';

const StaffRoomMap = () => {
  const { hotelId, loading: hotelLoading, error: hotelError } = useStaffHotel();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRooms = useCallback(async () => {
    if (hotelLoading) return;

    if (!hotelId) {
      setRooms([]);
      setError(hotelError || 'Tài khoản chưa được gán khách sạn');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const roomsData = await api.staffRoom.getHotelRooms();
      const normalized = roomsData.map((room) => normalizeRoomStatus(room));
      setRooms(sortRoomsByNumber(normalized));
    } catch (err) {
      console.error('Error fetching staff rooms:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  }, [hotelId, hotelLoading, hotelError]);

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

  if (hotelLoading || loading) {
    return (
      <div className="room-map-loading">
        <div className="loading-spinner" />
        <p>Đang tải sơ đồ phòng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-map-error">
        <p className="error-message">{error}</p>
        <button type="button" onClick={fetchRooms} className="retry-button">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="room-map staff-room-map">
      <div className="room-map__header">
        <OwnerGuideCollapsible label="Hướng dẫn sơ đồ phòng — bấm để xem">
          <div className="room-map__guide-card">
            <div className="room-map__guide-intro">
              <h3>Hướng dẫn xem sơ đồ phòng</h3>
              <p>
                Sơ đồ giúp bạn theo dõi tình trạng phòng trong ngày. Bạn có thể xem chi tiết từng phòng và cập nhật
                trạng thái vận hành (hoạt động, bảo trì, tạm ngưng) khi phòng đang trống.
              </p>
            </div>
            <div className="room-map__guide-grid">
              <div className="room-map__guide-item">
                <span className="room-map__guide-step">1</span>
                <div>
                  <strong>Đọc màu và chú thích</strong>
                  <p>
                    Quan sát màu trên thẻ phòng và bảng chú thích để biết phòng trống, chờ khách, đang có khách hoặc
                    đang bảo trì.
                  </p>
                </div>
              </div>
              <div className="room-map__guide-item">
                <span className="room-map__guide-step">2</span>
                <div>
                  <strong>Nhấn phòng để xem chi tiết</strong>
                  <p>
                    Mở hộp thông tin để xem loại phòng, giá, tiện nghi và trạng thái đặt phòng. Bạn không thể chỉnh
                    sửa thông tin phòng.
                  </p>
                </div>
              </div>
              <div className="room-map__guide-item">
                <span className="room-map__guide-step">3</span>
                <div>
                  <strong>Cập nhật trạng thái khi phòng trống</strong>
                  <p>
                    Trong hộp chi tiết, chọn &quot;Cập nhật trạng thái&quot; để đánh dấu bảo trì hoặc tạm ngưng. Chỉ
                    thực hiện được khi phòng không có khách (trạng thái đặt phòng là Trống).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </OwnerGuideCollapsible>
        <div className="room-map__header-content staff-room-map__header">
          <p className="room-map__instruction">Nhấn vào phòng để xem chi tiết và cập nhật trạng thái khi cần</p>
        </div>
      </div>

      <RoomStatusLegend />

      <div className="room-map__grid">
        {rooms.length === 0 ? (
          <div className="room-map__empty">
            <p>Chưa có phòng nào trong khách sạn.</p>
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

      <StaffRoomDetailModal
        room={selectedRoom}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onStatusUpdate={fetchRooms}
      />
    </div>
  );
};

export default StaffRoomMap;
