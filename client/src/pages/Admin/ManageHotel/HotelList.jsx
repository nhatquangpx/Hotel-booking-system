import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { hotelAPI } from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';
import '../../../components/Admin/AdminListPage.scss';

const HotelList = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState(null);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const data = await hotelAPI.getAllHotels();
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
      await hotelAPI.deleteHotel(hotelToDelete._id);
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

  const filteredHotels = hotels.filter(hotel => {
    const hotelAddress = formatAddress(hotel.address).toLowerCase();
    return (
      hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotelAddress.includes(searchTerm.toLowerCase()) ||
      (hotel.address?.city || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
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
      <div className="admin-list-container">
        <div className="list-header">
          <h2>Quản lý khách sạn</h2>
        </div>
        
        <div className="list-actions">
          <div className="search-filter-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, địa chỉ, thành phố"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Link to="/admin/hotels/create">
            <button className="create-button">Thêm khách sạn</button>
          </Link>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên khách sạn</th>
              <th>Địa chỉ</th>
              <th>Liên hệ</th>
              <th>Đánh giá</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredHotels.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-message">Không tìm thấy khách sạn nào</td>
              </tr>
            ) : (
              filteredHotels.map(hotel => (
                <tr key={hotel._id}>
                  <td>{hotel.name}</td>
                  <td>{formatAddress(hotel.address)}</td>
                  <td>{formatContact(hotel.contactInfo)}</td>
                  <td>{renderStarRating(hotel.starRating)}</td>
                  <td>
                    <span className={`status-badge ${hotel.status || 'unknown'}`}>
                      {getStatusLabel(hotel.status)}
                    </span>
                  </td>
                  <td className="action-buttons">
                    <Link to={`/admin/hotels/${hotel._id}`}>
                      <button className="view-btn">Xem</button>
                    </Link>
                    <Link to={`/admin/hotels/edit/${hotel._id}`}>
                      <button className="edit-btn">Sửa</button>
                    </Link>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteClick(hotel)}
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
                <p>Bạn có chắc chắn muốn xóa khách sạn <strong>{hotelToDelete?.name}</strong>?</p>
                <p>Tất cả phòng và thông tin liên quan sẽ bị xóa. Hành động này không thể hoàn tác.</p>
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

export default HotelList; 