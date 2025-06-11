import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconButton, Tooltip, Button, Paper, TextField, Collapse } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AdminLayout from '../../../components/Admin/AdminLayout';
import api from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';
import './HotelList.scss';

const HotelList = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchName, setSearchName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState(null);
  const [expandedHotelId, setExpandedHotelId] = useState(null);
  const [rooms, setRooms] = useState({});

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const data = await api.adminHotel.getAllHotels();
      console.log("Hotel data:", data);
      setHotels(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách khách sạn');
    } finally {
      setLoading(false);
    }
  };

  // Format địa chỉ thành chuỗi
  const formatAddress = (address) => {
    if (!address) return 'Không có địa chỉ';
    
    // Nếu address là một object (có thể có dạng {number, street, city})
    if (typeof address === 'object') {
      const parts = [];
      if (address.number) parts.push(address.number);
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      
      return parts.length > 0 ? parts.join(', ') : 'Không có địa chỉ';
    }
    
    // Nếu address là string
    return address;
  };

  // Format thông tin liên hệ
  const formatContact = (contactInfo) => {
    if (!contactInfo) return 'Không có thông tin';
    
    if (typeof contactInfo === 'object') {
      return contactInfo.phone || contactInfo.email || 'Không có thông tin';
    }
    
    return contactInfo;
  };

  // Hiển thị trạng thái
  const getStatusLabel = (status) => {
    if (!status) return 'Không xác định';
    
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Tạm ngưng';
      case 'maintenance':
        return 'Bảo trì';
      default:
        return status;
    }
  };

  // Hiển thị đánh giá sao
  const renderStarRating = (rating) => {
    if (!rating) return <FaStar />;
  
    const starRating = Math.min(Math.max(parseInt(rating) || 0, 1), 5);
  
    return (
      <>
        {Array.from({ length: starRating }, (_, i) => (
          <FaStar key={i} color="gold" />
        ))}
      </>
    );
  };
  

  const handleDeleteClick = (hotel) => {
    setHotelToDelete(hotel);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!hotelToDelete) return;
    
    try {
      await api.adminHotel.deleteHotel(hotelToDelete._id);
      setHotels(hotels.filter(hotel => hotel._id !== hotelToDelete._id));
      setShowDeleteModal(false);
      setHotelToDelete(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi xóa khách sạn');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setHotelToDelete(null);
  };

  const handleExpandClick = async (hotelId) => {
    if (expandedHotelId === hotelId) {
      setExpandedHotelId(null);
    } else {
      setExpandedHotelId(hotelId);
      if (!rooms[hotelId]) {
        try {
          const data = await api.adminRoom.getRoomsByHotel(hotelId);
          setRooms(prev => ({ ...prev, [hotelId]: data }));
        } catch (err) {
          console.error('Lỗi khi lấy danh sách phòng:', err);
        }
      }
    }
  };

  const handleDeleteRoom = async (hotelId, roomId) => {
    try {
      await api.adminRoom.deleteRoom(roomId);
      setRooms(prev => ({
        ...prev,
        [hotelId]: prev[hotelId].filter(room => room._id !== roomId)
      }));
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi xóa phòng');
    }
  };

  // Thêm hàm format giá phòng
  const formatPrice = (price) => {
    if (!price) return '0 VNĐ';
    if (typeof price === 'object') {
      return `${price.regular.toLocaleString('vi-VN')} VNĐ`;
    }
    return `${price.toLocaleString('vi-VN')} VNĐ`;
  };

  // Thêm hàm format loại phòng
  const formatRoomType = (type) => {
    const typeMap = {
      'standard': 'Phòng tiêu chuẩn',
      'deluxe': 'Phòng cao cấp',
      'suite': 'Phòng Suite',
      'family': 'Phòng gia đình',
      'executive': 'Phòng hạng sang'
    };
    return typeMap[type] || type;
  };

  const filteredHotels = hotels.filter(hotel =>
    hotel.name?.toLowerCase().includes(searchName.toLowerCase()) &&
    formatAddress(hotel.address).toLowerCase().includes(searchAddress.toLowerCase()) &&
    formatContact(hotel.contactInfo).includes(searchPhone)
  );

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
      <h1>Danh sách khách sạn</h1>
      <div className="hotel-list-container">
        <Paper className="search-bar" sx={{ background: 'var(--admin-sidebar)' }}>
          <div className="search-bar-row">
            <div className="search-bar-inputs">
              <TextField
                label="Tìm theo tên"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                size="small"
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
              <TextField
                label="Địa chỉ"
                value={searchAddress}
                onChange={e => setSearchAddress(e.target.value)}
                size="small"
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
              <TextField
                label="Số điện thoại"
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                size="small"
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
            </div>
            <Link to="/admin/hotels/create" className="add-hotel-btn-link" style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                sx={{ 
                  backgroundColor: 'var(--admin-primary)',
                  '&:hover': { backgroundColor: 'var(--admin-primary)', opacity: 0.8 }
                }}
              >
                Thêm khách sạn
              </Button>
            </Link>
          </div>
        </Paper>
        {error && <div className="error-message">{error}</div>}
        <div className="hotel-table">
          <table>
            <thead>
              <tr>
                <th>Tên khách sạn</th>
                <th>Địa chỉ</th>
                <th>Liên hệ</th>
                <th>Xếp hạng</th>
                <th>Chủ khách sạn</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredHotels.map((hotel) => (
                <React.Fragment key={hotel._id}>
                  <tr>
                    <td>{hotel.name}</td>
                    <td>{formatAddress(hotel.address)}</td>
                    <td>{formatContact(hotel.contactInfo)}</td>
                    <td>{hotel.starRating} sao</td>
                    <td>{hotel.ownerId?.name || 'Chưa có'}</td>
                    <td>
                      <span className={`status-badge ${hotel.status}`}>
                        {getStatusLabel(hotel.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            component={Link}
                            to={`/admin/hotels/${hotel._id}`}
                            size="small"
                            color="primary"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            component={Link}
                            to={`/admin/hotels/${hotel._id}/edit`}
                            size="small"
                            color="black"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton
                            onClick={() => handleDeleteClick(hotel)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Thêm phòng">
                          <IconButton
                            component={Link}
                            to={`/admin/hotels/${hotel._id}/rooms/create`}
                            size="small"
                            color="primary"
                          >
                            <AddIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={expandedHotelId === hotel._id ? "Thu gọn" : "Xem phòng"}>
                          <IconButton
                            onClick={() => handleExpandClick(hotel._id)}
                            size="small"
                          >
                            {expandedHotelId === hotel._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="7" className="rooms-expand">
                      <Collapse in={expandedHotelId === hotel._id}>
                        <div className="rooms-list">
                          <h3>Danh sách phòng</h3>
                          {rooms[hotel._id]?.length > 0 ? (
                            <table>
                              <thead>
                                <tr>
                                  <th>Số phòng</th>
                                  <th>Loại phòng</th>
                                  <th>Giá</th>
                                  <th>Số người</th>
                                  <th>Trạng thái</th>
                                  <th>Thao tác</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rooms[hotel._id].map(room => (
                                  <tr key={room._id}>
                                    <td>{room.roomNumber}</td>
                                    <td>{formatRoomType(room.type)}</td>
                                    <td>{formatPrice(room.price)}</td>
                                    <td>{room.maxPeople} người</td>
                                    <td>
                                      <span className={`status-badge ${room.status}`}>
                                        {room.status === 'active' ? 'Hoạt động' : 
                                         room.status === 'maintenance' ? 'Bảo trì' : 
                                         room.status === 'inactive' ? 'Tạm ngưng' : room.status}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="action-buttons">
                                        <Tooltip title="Xem chi tiết">
                                          <IconButton
                                            component={Link}
                                            to={`/admin/rooms/${room._id}`}
                                            size="small"
                                            color="primary"
                                          >
                                            <VisibilityIcon />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Chỉnh sửa">
                                          <IconButton
                                            component={Link}
                                            to={`/admin/rooms/${room._id}/edit`}
                                            size="small"
                                            color="black"
                                          >
                                            <EditIcon />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Xóa">
                                          <IconButton
                                            onClick={() => handleDeleteRoom(hotel._id, room._id)}
                                            size="small"
                                            color="error"
                                          >
                                            <DeleteIcon />
                                          </IconButton>
                                        </Tooltip>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>Chưa có phòng nào</p>
                          )}
                        </div>
                      </Collapse>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {showDeleteModal && (
          <div className="delete-modal">
            <div className="modal-content">
              <div className="modal-title">Xác nhận xóa</div>
              <p>Bạn có chắc chắn muốn xóa khách sạn <strong>{hotelToDelete?.name}</strong>?</p>
              <p>Hành động này không thể hoàn tác.</p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={handleCancelDelete}>Hủy</button>
                <button className="delete-btn" onClick={handleConfirmDelete}>Xác nhận xóa</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default HotelList; 