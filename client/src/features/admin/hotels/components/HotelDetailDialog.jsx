import React, { useState, useEffect, useCallback } from 'react';
import { FaStar } from 'react-icons/fa';
import { IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@/components/ui/Dialog';
import RoomStatusBadges from '@/features/admin/components/RoomStatusBadges';
import api from '../../../../apis';
import { getImageUrl } from '../../../../constants/images';
import { getHotelStatusLabel, getRoomPrice } from '@/shared/utils';
import { formatRoomType } from '@/constants/roomTypes';
import './HotelDetailDialog.scss';

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

const renderStarRating = (rating) => {
  if (!rating) return <FaStar />;
  const starRating = Math.min(Math.max(parseInt(rating, 10) || 0, 1), 5);
  return (
    <>
      {Array.from({ length: starRating }, (_, i) => (
        <FaStar key={i} color="gold" />
      ))}
    </>
  );
};

const HotelDetailDialog = ({ isOpen, onClose, hotelId, onEdit }) => {
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHotelData = useCallback(async () => {
    if (!hotelId) return;
    try {
      setLoading(true);
      setError(null);
      const hotelData = await api.adminHotel.getHotelById(hotelId);
      setHotel(hotelData);
      const roomsData = await api.adminRoom.getRoomsByHotel(hotelId);
      setRooms(roomsData);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tải thông tin khách sạn');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    if (!isOpen || !hotelId) {
      setHotel(null);
      setRooms([]);
      setError(null);
      return;
    }
    fetchHotelData();
  }, [isOpen, hotelId, fetchHotelData]);

  const handleEdit = () => {
    onEdit?.(hotel);
    onClose();
  };

  const paymentQr = hotel?.paymentConfig?.qr || {};
  const paymentVnpay = hotel?.paymentConfig?.vnpay || {};
  const isQrReady = Boolean(
    String(paymentQr.accountName || '').trim() &&
    String(paymentQr.accountNumber || '').trim() &&
    String(paymentQr.bankName || '').trim() &&
    String(paymentQr.qrImageUrl || '').trim()
  );
  const isVnpayReady = Boolean(paymentVnpay.isConfigured);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết khách sạn"
      maxWidth="960px"
      className="hotel-detail-dialog"
    >
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : hotel ? (
        <div className="hotel-detail-content">
          <div className="detail-header">
            <h3>{hotel.name}</h3>
            <Tooltip title="Chỉnh sửa">
              <IconButton color="primary" onClick={handleEdit} size="small">
                <EditIcon />
              </IconButton>
            </Tooltip>
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
              <div className="detail-value">{getHotelStatusLabel(hotel.status)}</div>
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
              <div className="detail-value">{hotel.description || '—'}</div>
            </div>

            <div className="detail-row detail-row--payment">
              <div className="detail-label">Phương thức thanh toán:</div>
              <div className="detail-value">
                <div className="payment-method-grid">
                  <div className="payment-method-card">
                    <div className="payment-method-card__header">
                      <span className="payment-method-card__title">Chuyển khoản QR</span>
                      <span className={`payment-method-card__status ${isQrReady ? 'is-ready' : 'is-missing'}`}>
                        {isQrReady ? 'Đã cấu hình đầy đủ' : 'Thiếu thông tin'}
                      </span>
                    </div>
                    <div className="payment-method-card__content">
                      <div className="payment-method-card__info-grid">
                        <div>
                          <strong>Chủ tài khoản:</strong> {paymentQr.accountName || 'Chưa cấu hình'}
                        </div>
                        <div>
                          <strong>Số tài khoản:</strong> {paymentQr.accountNumber || 'Chưa cấu hình'}
                        </div>
                        <div>
                          <strong>Ngân hàng:</strong> {paymentQr.bankName || 'Chưa cấu hình'}
                        </div>
                      </div>
                      <div className="payment-method-card__qr">
                        {paymentQr.qrImageUrl ? (
                          <img
                            src={getImageUrl(paymentQr.qrImageUrl)}
                            alt="QR thanh toán của khách sạn"
                            className="payment-qr-image"
                          />
                        ) : (
                          <div className="payment-qr-placeholder">Chưa có ảnh QR</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="payment-method-card">
                    <div className="payment-method-card__header">
                      <span className="payment-method-card__title">VNPay merchant riêng</span>
                      <span className={`payment-method-card__status ${isVnpayReady ? 'is-ready' : 'is-missing'}`}>
                        {isVnpayReady ? 'Đã cấu hình đầy đủ' : 'Chưa cấu hình'}
                      </span>
                    </div>
                    <div className="payment-method-card__info-grid">
                      <div>
                        <strong>TMN Code:</strong> {paymentVnpay.tmnCode || 'Chưa cấu hình'}
                      </div>
                      <div>
                        <strong>Secure Secret:</strong>{' '}
                        {isVnpayReady
                          ? 'Đã lưu trên server (không hiển thị vì lý do bảo mật)'
                          : 'Chưa cấu hình'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {hotel.images?.length > 0 && (
              <div className="detail-row">
                <div className="detail-label">Ảnh khách sạn:</div>
                <div className="detail-value image-gallery">
                  {hotel.images.map((img, index) => (
                    <img
                      key={index}
                      src={getImageUrl(img)}
                      alt={`Hotel ${index + 1}`}
                      className="detail-image-thumb"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="section-title">
            <h4>Danh sách phòng</h4>
          </div>
          <div className="room-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Số phòng</th>
                  <th>Loại phòng</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <tr key={room._id}>
                      <td>
                        {room.images?.length > 0 ? (
                          <img
                            src={getImageUrl(room.images[0])}
                            alt={room.roomNumber}
                            className="room-image-thumb"
                          />
                        ) : (
                          <div className="no-image">Không có ảnh</div>
                        )}
                      </td>
                      <td>{room.roomNumber}</td>
                      <td>{formatRoomType(room.type)}</td>
                      <td>
                        {getRoomPrice(room.price).toLocaleString('vi-VN')} VND
                      </td>
                      <td>
                        <RoomStatusBadges room={room} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center">Chưa có phòng nào</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
};

export default HotelDetailDialog;
