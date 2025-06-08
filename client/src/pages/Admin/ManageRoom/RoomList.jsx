import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { adminRoomAPI, adminHotelAPI } from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHotel, setFilterHotel] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  useEffect(() => {
    fetchRooms();
    fetchHotels();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await adminRoomAPI.getAllRooms();
      setRooms(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const data = await adminHotelAPI.getAllHotels();
      setHotels(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách khách sạn:', err);
    }
  };

  const handleDeleteClick = (room) => {
    setRoomToDelete(room);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    
    try {
      await adminRoomAPI.deleteRoom(roomToDelete._id);
      setRooms(rooms.filter(room => room._id !== roomToDelete._id));
      setShowDeleteModal(false);
      setRoomToDelete(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi xóa phòng');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setRoomToDelete(null);
  };

  const getHotelNameById = (hotelId) => {
    const hotel = hotels.find(h => h._id === hotelId);
    return hotel ? hotel.name : 'Không xác định';
  };

  // Lọc phòng dựa theo tìm kiếm và bộ lọc
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getHotelNameById(room.hotelId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesHotelFilter = filterHotel ? room.hotelId === filterHotel : true;
    
    return matchesSearch && matchesHotelFilter;
  });

  if (loading) return (
    <AdminLayout>
      <div>Đang tải...</div>
    </AdminLayout>
  );
  
  if (error) return (
    <AdminLayout>
      <div className="error-message">{error}</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div>
        <div className="action-bar">
          <div className="search-filter-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên phòng, loại phòng"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-box">
              <select 
                value={filterHotel} 
                onChange={(e) => setFilterHotel(e.target.value)}
              >
                <option value="">Tất cả khách sạn</option>
                {hotels.map(hotel => (
                  <option key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Link to="/admin/rooms/create">
            <button className="add-button">Thêm phòng</button>
          </Link>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên phòng</th>
              <th>Khách sạn</th>
              <th>Loại phòng</th>
              <th>Giá (VND)</th>
              <th>Số lượng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>Không tìm thấy phòng nào</td>
              </tr>
            ) : (
              filteredRooms.map(room => (
                <tr key={room._id}>
                  <td>{room.name}</td>
                  <td>{getHotelNameById(room.hotelId)}</td>
                  <td>{room.type}</td>
                  <td>{room.price.toLocaleString('vi-VN')} VND</td>
                  <td>{room.quantity}</td>
                  <td>
                    <span className={`status-badge ${room.available ? 'available' : 'unavailable'}`}>
                      {room.available ? 'Còn trống' : 'Đã đặt'}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <Link to={`/admin/rooms/${room._id}`}>
                      <button className="view-btn">Xem</button>
                    </Link>
                    <Link to={`/admin/rooms/edit/${room._id}`}>
                      <button className="edit-btn">Sửa</button>
                    </Link>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteClick(room)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Xác nhận xóa</h2>
                <button className="close-button" onClick={handleCancelDelete}>&times;</button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc chắn muốn xóa phòng <strong>{roomToDelete?.name}</strong>?</p>
                <p>Hành động này không thể hoàn tác.</p>
                <div className="form-actions">
                  <button className="cancel-btn" onClick={handleCancelDelete}>Hủy</button>
                  <button className="submit-btn" onClick={handleConfirmDelete}>Xác nhận xóa</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default RoomList; 