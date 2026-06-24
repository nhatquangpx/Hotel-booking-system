import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@/components/ui/Dialog';
import RoomStatusBadges from '@/features/admin/components/RoomStatusBadges';
import api from '../../../../apis';
import { getImageUrl } from '../../../../constants/images';
import {
  getRoomPrice,
  normalizeRoomStatus,
  getBookingStatusLabel,
} from '@/shared/utils';
import { formatRoomType } from '@/constants/roomTypes';
import './RoomDetailDialog.scss';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getRoomPrice(price));

const RoomDetailDialog = ({ isOpen, onClose, roomId, onEdit, onViewHotel }) => {
  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !roomId) {
      setRoom(null);
      setHotel(null);
      setError(null);
      return;
    }

    const fetchRoomData = async () => {
      try {
        setLoading(true);
        setError(null);
        const roomData = await api.adminRoom.getRoomById(roomId);
        setRoom(roomData);

        if (roomData.hotelId) {
          const hotelId =
            typeof roomData.hotelId === 'object' ? roomData.hotelId._id : roomData.hotelId;
          if (hotelId) {
            const hotelData = await api.adminHotel.getHotelById(hotelId);
            setHotel(hotelData);
          }
        }
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin phòng');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [isOpen, roomId]);

  const handleEdit = () => {
    onEdit?.(room);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết phòng"
      maxWidth="800px"
      className="room-detail-dialog"
    >
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : room ? (
        <div className="room-detail-content">
          <div className="detail-header">
            <h3>{room.roomNumber}</h3>
            {onEdit && (
              <Tooltip title="Chỉnh sửa">
                <IconButton color="primary" onClick={handleEdit} size="small">
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
          </div>

          <div className="detail-body">
            <div className="detail-row">
              <div className="detail-label">Khách sạn:</div>
              <div className="detail-value">
                {hotel ? (
                  onViewHotel ? (
                    <button
                      type="button"
                      className="hotel-link"
                      onClick={() => onViewHotel(hotel)}
                    >
                      {hotel.name}
                    </button>
                  ) : (
                    hotel.name
                  )
                ) : (
                  'Không có thông tin'
                )}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Loại phòng:</div>
              <div className="detail-value">{formatRoomType(room.type)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Giá phòng:</div>
              <div className="detail-value">{formatPrice(room.price)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Số người tối đa:</div>
              <div className="detail-value">{room.maxPeople} người</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Trạng thái phòng:</div>
              <div className="detail-value">
                <RoomStatusBadges room={room} showBookingWhenEmpty />
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Trạng thái đặt phòng:</div>
              <div className="detail-value">
                {getBookingStatusLabel(normalizeRoomStatus(room).bookingStatus)}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Tiện nghi:</div>
              <div className="detail-value">
                {room.facilities?.length > 0 ? (
                  <div className="facilities-list">
                    {room.facilities.map((facility, index) => (
                      <span key={index} className="facility-tag">
                        {facility}
                      </span>
                    ))}
                  </div>
                ) : (
                  'Không có thông tin'
                )}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Mô tả:</div>
              <div className="detail-value">{room.description}</div>
            </div>
            {room.images?.length > 0 && (
              <div className="detail-row">
                <div className="detail-label">Ảnh phòng:</div>
                <div className="detail-value image-gallery">
                  {room.images.map((img, index) => (
                    <img
                      key={index}
                      src={getImageUrl(img)}
                      alt={`Room ${index + 1}`}
                      className="detail-image-thumb"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Dialog>
  );
};

export default RoomDetailDialog;
