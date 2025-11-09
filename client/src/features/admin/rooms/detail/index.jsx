import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AdminLayout } from '@/features/admin/components';
import api from '../../../../apis';
import { getImageUrl } from '../../../../constants/images';
import '@/features/admin/components/AdminComponents.scss';
import '@/features/admin/components/AdminDetailPage.scss';
import './RoomDetail.scss';

/**
 * Admin Room Detail page feature
 * View room details for admin
 */
const AdminRoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true);
        const roomData = await api.adminRoom.getRoomById(id);
        console.log("Room details:", roomData);
        setRoom(roomData);
        
        // Fetch hotel data using the hotelId from room data
        if (roomData.hotelId) {
          // Handle both string ID and populated hotel object
          const hotelId = typeof roomData.hotelId === 'object' ? roomData.hotelId._id : roomData.hotelId;
          if (hotelId) {
            const hotelData = await api.adminHotel.getHotelById(hotelId);
            setHotel(hotelData);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin phòng');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [id]);

  const formatRoomType = (type) => {
    const types = {
      standard: 'Phòng tiêu chuẩn',
      deluxe: 'Phòng cao cấp',
      suite: 'Phòng Suite',
      family: 'Phòng gia đình',
      executive: 'Phòng hạng sang'
    };
    return types[type] || type;
  };

  const formatRoomStatus = (status) => {
    const statuses = {
      active: 'Hoạt động',
      maintenance: 'Bảo trì',
      inactive: 'Tạm ngưng'
    };
    return statuses[status] || status;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
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

  if (!room) return (
    <AdminLayout>
      <div className="error-message">Không tìm thấy thông tin phòng</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="room-detail-container">
        <h1>Chi tiết phòng</h1>
        <div className="detail-card">
          <div className="detail-header">
            <h3>{room.roomNumber}</h3>
            <div className="detail-actions">
              <Tooltip title="Chỉnh sửa">
                <IconButton 
                  color="primary"
                  onClick={() => navigate(`/admin/rooms/${id}/edit`)}
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
              <div className="detail-label">Khách sạn:</div>
              <div className="detail-value">
                {hotel ? (
                  <span 
                    className="hotel-link"
                    onClick={() => navigate(`/admin/hotels/${hotel._id}`)}
                  >
                    {hotel.name}
                  </span>
                ) : 'Không có thông tin'}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Loại phòng:</div>
              <div className="detail-value">{formatRoomType(room.type)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Giá phòng:</div>
              <div className="detail-value">
                {formatPrice(room.price.regular)}
                {room.price.discount > 0 && (
                  <span className="discount-price">
                    {' '}
                    (Giảm: {formatPrice(room.price.discount)})
                  </span>
                )}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Số người tối đa:</div>
              <div className="detail-value">{room.maxPeople} người</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Trạng thái:</div>
              <div className="detail-value">{formatRoomStatus(room.status)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Tiện nghi:</div>
              <div className="detail-value">
                {room.facilities && room.facilities.length > 0 ? (
                  <div className="facilities-list">
                    {room.facilities.map((facility, index) => (
                      <span key={index} className="facility-tag">{facility}</span>
                    ))}
                  </div>
                ) : 'Không có thông tin'}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Mô tả:</div>
              <div className="detail-value">{room.description}</div>
            </div>
            {room.images && room.images.length > 0 && (
              <div className="detail-row">
                <div className="detail-label">Ảnh phòng:</div>
                <div className="detail-value image-gallery">
                  {room.images.map((img, index) => (
                    <img 
                      key={index} 
                      src={getImageUrl(img)} 
                      alt={`Room image ${index}`}
                      width={250}
                      className="detail-image-thumb" 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRoomDetailPage;
