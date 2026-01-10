import { getImageUrl } from '@/constants/images';
import './RoomList.scss';

/**
 * Room List Component
 * Hiển thị danh sách phòng có sẵn sau khi tìm kiếm
 */
const RoomList = ({ rooms, onRoomSelect, loading, searchPerformed }) => {
  if (!searchPerformed) return null;

  if (loading) {
    return (
      <div className="room-list-loading">
        <div className="loading">Đang tìm phòng trống...</div>
      </div>
    );
  }

  return (
    <div className="room-list">
      <h2>Phòng có sẵn</h2>
      {rooms.length === 0 ? (
        <div className="no-rooms">Không có phòng trống trong thời gian bạn chọn</div>
      ) : (
        <div className="room-grid">
          {rooms.map((room) => (
            <div className="room-card" key={room._id}>
              <div className="room-image">
                <img 
                  src={room.images && room.images[0] ? getImageUrl(room.images[0]) : 'https://via.placeholder.com/300x200?text=Không+có+hình'} 
                  alt={room.name} 
                />
              </div>
              <div className="room-info">
                <h3>{room.roomNumber}</h3>
                <p className="room-type">{room.type}</p>
                <div className="room-price">
                  <span className="price">{room.price.regular.toLocaleString('vi-VN')} VNĐ</span>
                  <span className="per-night">/ đêm</span>
                </div>
                <button 
                  className="book-btn"
                  onClick={() => onRoomSelect(room)}
                >
                  Đặt phòng
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomList;

