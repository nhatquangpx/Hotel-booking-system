import { getImageUrl } from '@/constants/images';
import { formatCurrency, getRoomPrice } from '@/shared/utils';
import GuestSalePricingBreakdown from '@/features/guest/components/GuestSalePricingBreakdown';
import './RoomList.scss';

/**
 * Room List Component
 * Hiển thị danh sách phòng có sẵn sau khi tìm kiếm (kèm giá gốc / sau KM từ server)
 */
const RoomList = ({ rooms, bookingDates, onRoomSelect, loading, searchPerformed }) => {
  if (!searchPerformed) return null;

  if (loading) {
    return (
      <div className="room-list-loading">
        <div className="loading">Đang tìm phòng trống...</div>
      </div>
    );
  }

  return (
    <div className="room-list">
      <h2>Phòng có sẵn</h2>
      {bookingDates?.checkInDate && bookingDates?.checkOutDate && (
        <p className="room-list-dates">
          {new Date(bookingDates.checkInDate).toLocaleDateString('vi-VN')} —{' '}
          {new Date(bookingDates.checkOutDate).toLocaleDateString('vi-VN')}
        </p>
      )}
      {rooms.length === 0 ? (
        <div className="no-rooms">Không có phòng trống trong thời gian bạn chọn</div>
      ) : (
        <div className="room-grid">
          {rooms.map((room) => {
            const sp = room.salePricing;
            const hasSale = sp && sp.discountAmount > 0 && sp.displayPercentOff > 0;

            return (
              <div className="room-card" key={room._id}>
                <div className="room-image">
                  <img
                    src={
                      room.images && room.images[0]
                        ? getImageUrl(room.images[0])
                        : 'https://via.placeholder.com/300x200?text=Không+có+hình'
                    }
                    alt={room.name}
                  />
                </div>
                <div className="room-info">
                  <h3>{room.roomNumber}</h3>
                  <p className="room-type">{room.type}</p>

                  <div className="room-price-block">
                    {hasSale ? (
                      <>
                        <div className="room-price-row">
                          <span className="price-label">Giá gốc</span>
                          <span className="price-original">
                            {formatCurrency(sp.nightlyBase)}/đêm
                          </span>
                        </div>
                        <div className="room-price-row room-price-row--promo">
                          <span className="sale-badge">Giảm {sp.displayPercentOff}%</span>
                          <span className="price-final">
                            {formatCurrency(sp.finalNightly)}/đêm
                          </span>
                        </div>
                        {sp.nights > 1 && (
                          <p className="price-stay-total">
                            Tổng cả kỳ ({sp.nights} đêm):{' '}
                            <strong>{formatCurrency(sp.finalAmount)}</strong>
                            <span className="price-stay-compare">
                              {' '}
                              (thay vì {formatCurrency(sp.basePrice)})
                            </span>
                          </p>
                        )}
                        <GuestSalePricingBreakdown pricing={sp} variant="compact" />
                      </>
                    ) : (
                      <div className="room-price">
                        <span className="price">{formatCurrency(sp?.nightlyBase ?? getRoomPrice(room.price))}</span>
                        <span className="per-night">/ đêm</span>
                      </div>
                    )}
                  </div>

                  <button className="book-btn" onClick={() => onRoomSelect(room)}>
                    Đặt phòng
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoomList;
