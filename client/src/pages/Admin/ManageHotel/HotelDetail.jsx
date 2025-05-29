import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { hotelAPI, roomAPI } from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';
import '../../../components/Admin/AdminDetailPage.scss';

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
        const hotelData = await hotelAPI.getHotelById(id);
        console.log("Hotel details:", hotelData);
        setHotel(hotelData);
        
        // Tải danh sách phòng của khách sạn
        const roomsData = await roomAPI.getRoomsByHotel(id);
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
      <div>Đang tải...</div>
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
      <div className="admin-detail-container">
        <div className="detail-header">
          <h2>{hotel.name}</h2>
          <div className="detail-actions">
            <button 
              className="edit-btn"
              onClick={() => navigate(`/admin/hotels/edit/${id}`)}
            >
              Chỉnh sửa
            </button>
            <button 
              className="back-btn"
              onClick={() => navigate('/admin/hotels')}
            >
              Quay lại
            </button>
          </div>
        </div>
        
        <div className="detail-content">
          <div className="image-section">
            {hotel.images && hotel.images.length > 0 ? (
              <img src={hotel.images[0]} alt={hotel.name} className="main-image" />
            ) : (
              <div className="no-image">Không có hình ảnh</div>
            )}
            
            {hotel.images && hotel.images.length > 1 && (
              <div className="image-gallery">
                {hotel.images.slice(1).map((image, index) => (
                  <div key={index} className="gallery-item">
                    <img src={image} alt={`${hotel.name} - Ảnh ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="detail-section">
            <h3>Thông tin chung</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Trạng thái:</span>
                <span className={`status-badge ${hotel.status || 'unknown'}`}>
                  {getStatusLabel(hotel.status)}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Xếp hạng:</span>
                <span className="value">{renderStarRating(hotel.starRating)}</span>
              </div>
              <div className="info-item">
                <span className="label">Địa chỉ:</span>
                <span className="value">{formatAddress(hotel.address)}</span>
              </div>
              <div className="info-item">
                <span className="label">Thành phố:</span>
                <span className="value">{hotel.address?.city || 'Không có thông tin'}</span>
              </div>
              <div className="info-item">
                <span className="label">Số phòng:</span>
                <span className="value">{rooms.length}</span>
              </div>
            </div>
          </div>
          
          <div className="detail-section">
            <h3>Mô tả</h3>
            <p className="description">{hotel.description}</p>
          </div>
          
          <div className="detail-section">
            <h3>Thông tin liên hệ</h3>
            <div className="info-grid">
              {hotel.contactInfo && (
                <>
                  <div className="info-item">
                    <span className="label">Điện thoại:</span>
                    <span className="value">{hotel.contactInfo.phone || 'Không có thông tin'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Email:</span>
                    <span className="value">{hotel.contactInfo.email || 'Không có thông tin'}</span>
                  </div>
                </>
              )}
              {!hotel.contactInfo && (
                <div className="info-item">
                  <span className="value">Không có thông tin liên hệ</span>
                </div>
              )}
            </div>
          </div>
          
          {hotel.policies && (
            <div className="detail-section">
              <h3>Chính sách</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Giờ nhận phòng:</span>
                  <span className="value">{hotel.policies.checkInTime || '14:00'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Giờ trả phòng:</span>
                  <span className="value">{hotel.policies.checkOutTime || '12:00'}</span>
                </div>
                <div className="info-item full-width">
                  <span className="label">Chính sách hủy phòng:</span>
                  <span className="value">{hotel.policies.cancellationPolicy || 'Không có thông tin'}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="detail-section">
            <h3>Tiện nghi</h3>
            <div className="facilities-list">
              {hotel.facilities && hotel.facilities.map((facility, index) => (
                <div key={index} className="facility-item">
                  {facility}
                </div>
              ))}
              {(!hotel.facilities || hotel.facilities.length === 0) && (
                <p>Không có thông tin tiện nghi</p>
              )}
            </div>
          </div>
          
          <div className="related-items">
            <div className="section-header">
              <h3>Danh sách phòng</h3>
              <Link to={`/admin/rooms/create?hotelId=${id}`}>
                <button className="add-button">Thêm phòng</button>
              </Link>
            </div>
            
            {rooms.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tên phòng</th>
                    <th>Loại phòng</th>
                    <th>Giá (VND)</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(room => (
                    <tr key={room._id}>
                      <td>{room.name}</td>
                      <td>{room.type}</td>
                      <td>
                        {room.price?.regular ? room.price.regular.toLocaleString('vi-VN') : 0} VND
                        {room.price?.discount > 0 && (
                          <div className="discount">Giảm: {room.price.discount.toLocaleString('vi-VN')} VND</div>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${room.status || 'unknown'}`}>
                          {room.status === 'available' ? 'Còn trống' : 
                           room.status === 'booked' ? 'Đã đặt' : 
                           room.status === 'maintenance' ? 'Bảo trì' : 'Không xác định'}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <Link to={`/admin/rooms/${room._id}`}>
                          <button className="view-btn">Xem</button>
                        </Link>
                        <Link to={`/admin/rooms/edit/${room._id}`}>
                          <button className="edit-btn">Sửa</button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Khách sạn này chưa có phòng nào</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default HotelDetail; 