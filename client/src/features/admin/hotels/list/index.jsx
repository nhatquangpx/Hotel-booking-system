import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IconButton, Tooltip, Button, Paper, TextField, Collapse } from '@mui/material';
import { FaStar } from 'react-icons/fa';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { AdminLayout } from '@/features/admin/components';
import RoomStatusBadges from '@/features/admin/components/RoomStatusBadges';
import HotelFormDialog from '../components/HotelFormDialog';
import HotelDetailDialog from '../components/HotelDetailDialog';
import RoomFormDialog from '../../rooms/components/RoomFormDialog';
import RoomDetailDialog from '../../rooms/components/RoomDetailDialog';
import api from '../../../../apis';
import './HotelList.scss';

/**
 * Admin Hotel List page feature
 * List and manage hotels for admin
 */
const AdminHotelListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [showHotelDialog, setShowHotelDialog] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [selectedHotelForRoom, setSelectedHotelForRoom] = useState(null);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [viewingRoomId, setViewingRoomId] = useState(null);
  const [viewingHotelId, setViewingHotelId] = useState(null);

  useEffect(() => {
    const hotelId = searchParams.get('hotelId');
    if (hotelId) {
      setViewingHotelId(hotelId);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const data = await api.adminHotel.getAllHotels();
      setHotels(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách khách sạn');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'Không có địa chỉ';
    if (typeof address === 'object') {
      const parts = [];
      if (address.number) parts.push(address.number);
      if (address.street) parts.push(address.street);
      if (address.city) parts.push(address.city);
      return parts.length > 0 ? parts.join(', ') : 'Không có địa chỉ';
    }
    return address;
  };

  const formatContact = (contactInfo) => {
    if (!contactInfo) return 'Không có thông tin';
    if (typeof contactInfo === 'object') {
      return contactInfo.phone || contactInfo.email || 'Không có thông tin';
    }
    return contactInfo;
  };

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

  const handleOpenCreateDialog = () => {
    setEditingHotel(null);
    setShowHotelDialog(true);
  };

  const handleOpenEditDialog = (hotel) => {
    setEditingHotel(hotel);
    setShowHotelDialog(true);
  };

  const handleOpenViewHotelDialog = (hotel) => {
    setViewingHotelId(hotel._id);
  };

  const handleCloseViewHotelDialog = () => {
    setViewingHotelId(null);
  };

  const handleEditFromHotelDetail = (hotel) => {
    handleOpenEditDialog(hotel);
  };

  const handleViewHotelFromRoom = (hotel) => {
    setViewingRoomId(null);
    setViewingHotelId(hotel._id);
  };

  const handleCloseHotelDialog = () => {
    setShowHotelDialog(false);
    setEditingHotel(null);
  };

  const handleHotelSuccess = () => {
    fetchHotels();
  };

  const handleOpenCreateRoomDialog = (hotel) => {
    setEditingRoomId(null);
    setSelectedHotelForRoom(hotel);
    setShowRoomDialog(true);
  };

  const handleOpenEditRoomDialog = (room) => {
    setSelectedHotelForRoom(null);
    setEditingRoomId(room._id);
    setShowRoomDialog(true);
  };

  const handleOpenViewRoomDialog = (room) => {
    setViewingRoomId(room._id);
  };

  const handleEditRoomFromDetail = (room) => {
    handleOpenEditRoomDialog(room);
  };

  const handleCloseRoomDialog = () => {
    setShowRoomDialog(false);
    setSelectedHotelForRoom(null);
    setEditingRoomId(null);
  };

  const handleRoomSuccess = () => {
    const hotelIds = new Set();
    if (selectedHotelForRoom?._id) hotelIds.add(selectedHotelForRoom._id);
    if (expandedHotelId) hotelIds.add(expandedHotelId);
    if (editingRoomId) {
      Object.entries(rooms).forEach(([hotelId, roomList]) => {
        if (roomList?.some((room) => room._id === editingRoomId)) {
          hotelIds.add(hotelId);
        }
      });
    }

    hotelIds.forEach((hotelId) => {
      api.adminRoom.getRoomsByHotel(hotelId)
        .then((data) => {
          setRooms((prev) => ({ ...prev, [hotelId]: data }));
        })
        .catch((err) => console.error('Error fetching rooms:', err));
    });
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

  const formatPrice = (price) => {
    if (!price) return '0 VNĐ';
    if (typeof price === 'object') {
      return `${price.regular.toLocaleString('vi-VN')} VNĐ`;
    }
    return `${price.toLocaleString('vi-VN')} VNĐ`;
  };

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
      <div className="admin-hotel-list-page">
        <Paper className="search-bar" sx={{ background: 'var(--admin-sidebar)' }}>
          <div className="search-filters-row">
            <div className="search-bar-inputs">
              <TextField
                label="Tìm theo tên"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
              <TextField
                label="Địa chỉ"
                value={searchAddress}
                onChange={e => setSearchAddress(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
              <TextField
                label="Số điện thoại"
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ style: { color: 'var(--admin-text)' } }}
                InputProps={{ style: { color: 'var(--admin-text)' } }}
              />
            </div>
            <div className="add-hotel-btn-link" onClick={handleOpenCreateDialog}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                sx={{
                  backgroundColor: 'var(--admin-primary)',
                  '&:hover': { backgroundColor: 'var(--admin-primary-hover)' },
                  cursor: 'pointer',
                }}
              >
                Thêm khách sạn
              </Button>
            </div>
          </div>
        </Paper>
        {error && <div className="error-message">{error}</div>}
        <div className="hotel-table">
          <table className="hotel-table-fixed">
            <colgroup>
              <col className="col-stt" />
              <col className="col-name" />
              <col className="col-address" />
              <col className="col-contact" />
              <col className="col-rating" />
              <col className="col-owner" />
              <col className="col-status" />
              <col className="col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th className="col-stt">STT</th>
                <th className="col-name">Tên khách sạn</th>
                <th className="col-address">Địa chỉ</th>
                <th className="col-contact">Liên hệ</th>
                <th className="col-rating">Xếp hạng</th>
                <th className="col-owner">Chủ khách sạn</th>
                <th className="col-status">Trạng thái</th>
                <th className="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center">
                    Không tìm thấy khách sạn nào
                  </td>
                </tr>
              ) : (
              filteredHotels.map((hotel, index) => (
                <React.Fragment key={hotel._id}>
                  <tr>
                    <td className="col-stt">{index + 1}</td>
                    <td className="col-name">
                      <span className="cell-ellipsis" title={hotel.name}>
                        {hotel.name}
                      </span>
                    </td>
                    <td className="col-address">
                      <span className="cell-ellipsis" title={formatAddress(hotel.address)}>
                        {formatAddress(hotel.address)}
                      </span>
                    </td>
                    <td className="col-contact">
                      <span className="cell-ellipsis" title={formatContact(hotel.contactInfo)}>
                        {formatContact(hotel.contactInfo)}
                      </span>
                    </td>
                    <td className="col-rating">
                      <span className="star-rating-cell">
                        {renderStarRating(hotel.starRating)}
                      </span>
                    </td>
                    <td className="col-owner">
                      <span className="cell-ellipsis" title={hotel.ownerId?.name}>
                        {hotel.ownerId?.name || 'Chưa có'}
                      </span>
                    </td>
                    <td className="col-status">
                      <span className={`status-badge ${hotel.status}`}>
                        {getStatusLabel(hotel.status)}
                      </span>
                    </td>
                    <td className="col-actions">
                      <div className="action-buttons">
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            onClick={() => handleOpenViewHotelDialog(hotel)}
                            size="small"
                            color="primary"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                          <IconButton
                            onClick={() => handleOpenEditDialog(hotel)}
                            size="small"
                            color="default"
                            sx={{ color: 'text.primary' }}
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
                            onClick={() => handleOpenCreateRoomDialog(hotel)}
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
                    <td colSpan={8} className="rooms-expand">
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
                                      <RoomStatusBadges room={room} />
                                    </td>
                                    <td>
                                      <div className="action-buttons">
                                        <Tooltip title="Xem chi tiết">
                                          <IconButton
                                            onClick={() => handleOpenViewRoomDialog(room)}
                                            size="small"
                                            color="primary"
                                          >
                                            <VisibilityIcon />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Chỉnh sửa">
                                          <IconButton
                                            onClick={() => handleOpenEditRoomDialog(room)}
                                            size="small"
                                            color="default"
                                            sx={{ color: 'text.primary' }}
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
              )))}
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

        <HotelFormDialog
          isOpen={showHotelDialog}
          onClose={handleCloseHotelDialog}
          hotelId={editingHotel?._id || null}
          onSuccess={handleHotelSuccess}
        />

        <HotelDetailDialog
          isOpen={!!viewingHotelId}
          onClose={handleCloseViewHotelDialog}
          hotelId={viewingHotelId}
          onEdit={handleEditFromHotelDetail}
        />

        <RoomFormDialog
          isOpen={showRoomDialog}
          onClose={handleCloseRoomDialog}
          hotelId={selectedHotelForRoom?._id || null}
          roomId={editingRoomId}
          onSuccess={handleRoomSuccess}
        />

        <RoomDetailDialog
          isOpen={!!viewingRoomId}
          onClose={() => setViewingRoomId(null)}
          roomId={viewingRoomId}
          onEdit={handleEditRoomFromDetail}
          onViewHotel={handleViewHotelFromRoom}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminHotelListPage;

