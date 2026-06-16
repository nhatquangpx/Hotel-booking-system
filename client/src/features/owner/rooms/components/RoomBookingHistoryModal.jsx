import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import api from '@/apis';
import { formatCurrency, formatDate } from '@/shared/utils';
import './RoomBookingHistoryModal.scss';

const PAYMENT_STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  paid: 'Đã thanh toán',
  cancelled: 'Đã hủy',
};

const PAYMENT_STATUS_CLASS = {
  pending: 'pending',
  paid: 'paid',
  cancelled: 'cancelled',
};

const RoomBookingHistoryModal = ({ room, isOpen, onClose }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const roomId = room?._id || room?.id;
  const roomNumber = room?.roomNumber || '';

  useEffect(() => {
    if (!isOpen || !roomId) return;

    let cancelled = false;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.ownerRoom.getRoomBookings(roomId);
        if (!cancelled) {
          setBookings(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err?.message || err?.response?.data?.message || 'Không thể tải lịch sử đặt phòng';
          setError(msg);
          setBookings([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchBookings();
    return () => {
      cancelled = true;
    };
  }, [isOpen, roomId]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const shortId = (id) => {
    if (!id) return '—';
    const s = String(id);
    return s.length > 8 ? `${s.slice(-8).toUpperCase()}` : s.toUpperCase();
  };

  return (
    <div
      className="room-booking-history-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-booking-history-title"
    >
      <div className="room-booking-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="room-booking-history-modal__header">
          <h2 id="room-booking-history-title">
            Lịch sử đặt phòng — Phòng {roomNumber}
          </h2>
          <button
            type="button"
            className="room-booking-history-modal__close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <FaTimes />
          </button>
        </div>

        <div className="room-booking-history-modal__body">
          {loading && (
            <div className="room-booking-history-modal__state">
              <div className="room-booking-history-modal__spinner" />
              <p>Đang tải lịch sử...</p>
            </div>
          )}

          {!loading && error && (
            <div className="room-booking-history-modal__state room-booking-history-modal__state--error">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && bookings.length === 0 && (
            <div className="room-booking-history-modal__state">
              <p>Chưa có đơn đặt phòng nào cho phòng này.</p>
            </div>
          )}

          {!loading && !error && bookings.length > 0 && (
            <>
              <p className="room-booking-history-modal__summary">
                {bookings.length} đơn đặt phòng
              </p>
              <div className="room-booking-history-modal__table-wrap">
                <table className="room-booking-history-modal__table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách</th>
                      <th>Nhận / Trả</th>
                      <th>Tổng tiền</th>
                      <th>Thanh toán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b._id}>
                        <td data-label="Mã đơn" className="room-booking-history-modal__id">
                          #{shortId(b._id)}
                        </td>
                        <td data-label="Khách">
                          <span className="room-booking-history-modal__guest-name">
                            {b.guest?.name || '—'}
                          </span>
                          {b.guest?.phone && (
                            <span className="room-booking-history-modal__guest-meta">
                              {b.guest.phone}
                            </span>
                          )}
                        </td>
                        <td data-label="Nhận / Trả">
                          <span>{formatDate(b.checkInDate)}</span>
                          <span className="room-booking-history-modal__date-sep">→</span>
                          <span>{formatDate(b.checkOutDate)}</span>
                        </td>
                        <td data-label="Tổng tiền">
                          {formatCurrency(b.finalAmount ?? 0)}
                        </td>
                        <td data-label="Thanh toán">
                          <span
                            className={`room-booking-history-modal__badge room-booking-history-modal__badge--${
                              PAYMENT_STATUS_CLASS[b.paymentStatus] || 'pending'
                            }`}
                          >
                            {PAYMENT_STATUS_LABELS[b.paymentStatus] || b.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="room-booking-history-modal__cards">
                {bookings.map((b) => (
                  <li key={`card-${b._id}`} className="room-booking-history-modal__card">
                    <div className="room-booking-history-modal__card-row">
                      <span className="room-booking-history-modal__card-label">Mã đơn</span>
                      <span>#{shortId(b._id)}</span>
                    </div>
                    <div className="room-booking-history-modal__card-row">
                      <span className="room-booking-history-modal__card-label">Khách</span>
                      <span>{b.guest?.name || '—'}</span>
                    </div>
                    <div className="room-booking-history-modal__card-row">
                      <span className="room-booking-history-modal__card-label">Nhận / Trả</span>
                      <span>
                        {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                      </span>
                    </div>
                    <div className="room-booking-history-modal__card-row">
                      <span className="room-booking-history-modal__card-label">Tổng tiền</span>
                      <span>{formatCurrency(b.finalAmount ?? 0)}</span>
                    </div>
                    <div className="room-booking-history-modal__card-row">
                      <span className="room-booking-history-modal__card-label">Thanh toán</span>
                      <span
                        className={`room-booking-history-modal__badge room-booking-history-modal__badge--${
                          PAYMENT_STATUS_CLASS[b.paymentStatus] || 'pending'
                        }`}
                      >
                        {PAYMENT_STATUS_LABELS[b.paymentStatus] || b.paymentStatus}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomBookingHistoryModal;
