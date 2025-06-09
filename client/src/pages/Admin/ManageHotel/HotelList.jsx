import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconButton, Tooltip, Button, Paper, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AdminLayout from '../../../components/Admin/AdminLayout';
import api from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';
import '../../../components/Admin/AdminListPage.scss';
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
                <tr key={hotel._id}>
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
                    </div>
                  </td>
                </tr>
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