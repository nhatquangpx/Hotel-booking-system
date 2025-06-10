import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdminLayout from '../../../components/Admin/AdminLayout';
import api from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';
import '../../../components/Admin/AdminDetailPage.scss';
import './HotelDetail.scss';

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        setLoading(true);
        const hotelData = await api.adminHotel.getHotelById(id);
        console.log("Hotel details:", hotelData);
        setHotel(hotelData);
        
        // Tải danh sách phòng của khách sạn
        const roomsData = await api.adminRoom.getRoomsByHotel(id);
        setRooms(roomsData);
        
        setError(null);
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin khách sạn');
      } finally {
        setLoading(false);
      }
    };

    fetchHotelData();
  }, [id]);

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

  if (loading) return (
    <AdminLayout>
      <div className="loading">Đang tải...</div>
    </AdminLayout>
  );
  
  if (error) return (
    <AdminLayout>
      <div className="error-message">{error}</div>
    </AdminLayout>
  );

  if (!hotel) return (
    <AdminLayout>
      <div className="error-message">Không tìm thấy thông tin khách sạn</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="hotel-detail-container">
        <h1>Chi tiết khách sạn</h1>
        <div className="detail-card">
          <div className="detail-header">
            <h3>{hotel.name}</h3>
            <div className="detail-actions">
              <Tooltip title="Chỉnh sửa">
                <IconButton 
                  color="primary"
                  onClick={() => navigate(`/admin/hotels/edit/${id}`)}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Quay lại">
                <IconButton 
                  color="primary"
                  onClick={() => navigate('/admin/hotels')}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-row">
              <div className="detail-label">Địa chỉ:</div>
              <div className="detail-value">{formatAddress(hotel.address)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Số điện thoại:</div>
              <div className="detail-value">{hotel.contactInfo?.phone || 'Không có thông tin'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Email:</div>
              <div className="detail-value">{hotel.contactInfo?.email || 'Không có thông tin'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Chủ khách sạn:</div>
              <div className="detail-value">{hotel.ownerId?.name || 'Không có thông tin'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Trạng thái:</div>
              <div className="detail-value">{getStatusLabel(hotel.status)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Xếp hạng:</div>
              <div className="detail-value">{renderStarRating(hotel.starRating)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Số phòng:</div>
              <div className="detail-value">{rooms.length}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Mô tả:</div>
              <div className="detail-value">{hotel.description}</div>
            </div>
            {hotel.images && hotel.images.length > 0 && (
              <div className="detail-row">
                <div className="detail-label">Ảnh khách sạn:</div>
                <div className="detail-value image-gallery">
                  {hotel.images.map((img, index) => (
                    <img 
                      key={index} 
                      src={`${import.meta.env.VITE_API_URL}${img}`} 
                      alt={`Hotel image ${index}`} 
                      className="detail-image-thumb" 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="section-title">
          <h3>Danh sách phòng</h3>
        </div>
        <div className="room-table">
          <table>
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên phòng</th>
                <th>Loại phòng</th>
                <th>Giá</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length > 0 ? rooms.map(room => (
                <tr key={room._id}>
                  <td>
                    {room.images && room.images.length > 0 ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL}${room.images[0]}`} 
                        alt={room.name} 
                        className="room-image-thumb"
                      />
                    ) : (
                      <div className="no-image">Không có ảnh</div>
                    )}
                  </td>
                  <td>{room.name}</td>
                  <td>{room.type}</td>
                  <td>{room.price?.regular ? room.price.regular.toLocaleString('vi-VN') : 0} VND</td>
                  <td>{room.status === 'available' ? 'Còn trống' : room.status === 'booked' ? 'Đã đặt' : 'Không xác định'}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>Chưa có phòng nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default HotelDetail; 