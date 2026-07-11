import { getImageUrl } from '@/constants/images';
import { formatCurrency, getRoomPrice } from '@/shared/utils';
import { formatRoomType } from '@/constants/roomTypes';
import GuestSalePricingBreakdown from '@/features/guest/components/GuestSalePricingBreakdown';
import './RoomList.scss';

const formatViDate = (iso) => {
  if (!iso) return '';
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('vi-VN');
};

const formatBlockedNightsLabel = (nights = []) => {
  if (!nights.length) return '';
  return nights.map(formatViDate).join(', ');
};

/**
 * Room List Component
 * Hiển thị danh sách phòng có sẵn / trống một phần sau khi tìm kiếm
 */
const RoomList = ({
  rooms,
  bookingDates,
  onRoomSelect,
  onApplySuggestedDates,
  loading,
  searchPerformed,
}) => {
  if (!searchPerformed) return null;

  if (loading) {
    return (
      <div className="room-list-loading">
        <div className="loading">Đang tìm phòng trống...</div>
      </div>
    );
  }

  const fullyAvailableCount = rooms.filter(
    (r) => r.availability?.status !== 'partial'
  ).length;
  const partialCount = rooms.length - fullyAvailableCount;

  return (
    <div className="room-list">
      <div className="room-list__header">
        <div>
          <h2>Phòng trống</h2>
          {bookingDates?.checkInDate && bookingDates?.checkOutDate && (
            <p className="room-list-dates">
              {bookingDates.checkInDate} → {bookingDates.checkOutDate}
              {rooms[0]?.salePricing?.nights || rooms[0]?.availability?.suggestion?.nights
                ? ` · ${
                    Math.round(
                      (new Date(`${bookingDates.checkOutDate}T12:00:00`) -
                        new Date(`${bookingDates.checkInDate}T12:00:00`)) /
                        (1000 * 60 * 60 * 24)
                    )
                  } đêm`
                : ''}
            </p>
          )}
        </div>
        {rooms.length > 0 ? (
          <span className="room-list__badge">
            {fullyAvailableCount > 0
              ? `${fullyAvailableCount} phòng còn trống`
              : `${partialCount} phòng trống một phần`}
            {fullyAvailableCount > 0 && partialCount > 0
              ? ` · ${partialCount} trống một phần`
              : ''}
          </span>
        ) : null}
      </div>

      {rooms.length === 0 ? (
        <div className="no-rooms">Không có phòng trống trong thời gian bạn chọn</div>
      ) : (
        <div className="room-list__items">
          {rooms.map((room) => {
            const sp = room.salePricing;
            const hasSale = sp && sp.discountAmount > 0 && sp.displayPercentOff > 0;
            const isPartial = room.availability?.status === 'partial';
            const suggestion = room.availability?.suggestion;
            const blockedLabel = formatBlockedNightsLabel(room.availability?.blockedNights);

            return (
              <div
                className={`room-card${isPartial ? ' room-card--partial' : ''}`}
                key={room._id}
              >
                <div className="room-image">
                  <img
                    src={
                      room.images && room.images[0]
                        ? getImageUrl(room.images[0])
                        : 'https://via.placeholder.com/300x200?text=Không+có+hình'
                    }
                    alt={room.name || room.roomNumber}
                  />
                </div>

                <div className="room-info">
                  <h3>{room.roomNumber || room.name}</h3>
                  <p className="room-type">
                    {formatRoomType(room.type)}
                    {room.maxPeople ? ` · tối đa ${room.maxPeople} khách` : ''}
                  </p>

                  {Array.isArray(room.facilities) && room.facilities.length > 0 ? (
                    <div className="room-tags">
                      {room.facilities.slice(0, 4).map((item) => (
                        <span key={item} className="room-tag">
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {isPartial ? (
                    <div className="room-partial" role="status">
                      <p className="room-partial__title">
                        Trùng lịch{blockedLabel ? `: ${blockedLabel}` : ''}
                      </p>
                      {suggestion ? (
                        <p className="room-partial__hint">
                          Còn trống{' '}
                          <strong>
                            {formatViDate(suggestion.checkInDate)} →{' '}
                            {formatViDate(suggestion.checkOutDate)}
                          </strong>{' '}
                          ({suggestion.nights} đêm). Giá bên cạnh tính theo khoảng trống này.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {hasSale ? (
                    <GuestSalePricingBreakdown
                      pricing={sp}
                      variant="compact"
                      className="room-sale-breakdown"
                    />
                  ) : null}
                </div>

                <div className="room-action">
                  <div className="room-price-block">
                    {hasSale ? (
                      <>
                        <div className="room-price-original">
                          {formatCurrency(sp.basePrice)}
                        </div>
                        <div className="room-price-total">
                          {formatCurrency(sp.finalAmount)}
                        </div>
                        <div className="room-price-night">
                          <span className="room-price-night__was">
                            {formatCurrency(sp.nightlyBase)}/đêm
                          </span>
                          <span className="room-price-night__now">
                            {formatCurrency(sp.finalNightly)}/đêm
                          </span>
                          <span className="sale-badge">−{sp.displayPercentOff}%</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="room-price-total">
                          {formatCurrency(
                            sp?.finalAmount ??
                              (sp?.nightlyBase ?? getRoomPrice(room.price)) *
                                (sp?.nights || suggestion?.nights || 1)
                          )}
                        </div>
                        <div className="room-price-night">
                          {formatCurrency(sp?.nightlyBase ?? getRoomPrice(room.price))}/đêm
                        </div>
                      </>
                    )}
                  </div>

                  {isPartial && suggestion ? (
                    <div className="room-action__buttons">
                      <button
                        type="button"
                        className="book-btn book-btn--secondary"
                        onClick={() => onApplySuggestedDates?.(suggestion)}
                      >
                        Dùng ngày trống
                      </button>
                      <button
                        type="button"
                        className="book-btn"
                        onClick={() =>
                          onRoomSelect(room, {
                            checkInDate: suggestion.checkInDate,
                            checkOutDate: suggestion.checkOutDate,
                          })
                        }
                      >
                        Đặt khoảng trống
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="book-btn"
                      onClick={() => onRoomSelect(room)}
                    >
                      Đặt phòng
                    </button>
                  )}
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
