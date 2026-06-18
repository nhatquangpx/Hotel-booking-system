import { Link } from 'react-router-dom';
import { getImageUrl } from '@/constants/images';
import { hotelDetailPath } from '@/constants/routes';
import {
  getHotelStatusLabel,
  isGuestBookableHotel,
  getHotelStatusBannerMessage,
} from '@/shared/utils';
import { HotelWishlistButton } from './HotelWishlistButton';
import './HotelCard.scss';

/**
 * Hotel Card component
 * Displays hotel information in a card format
 */
export const HotelCard = ({ hotel, isWishlisted, onWishlistedChange }) => {
  if (!hotel) return null;

  const bookable = hotel.guestBookable !== undefined ? hotel.guestBookable : isGuestBookableHotel(hotel);
  const status = hotel.status || 'active';
  const statusMessage = !bookable ? getHotelStatusBannerMessage(status) : '';

  const imageUrl = hotel.images && hotel.images[0] 
    ? getImageUrl(hotel.images[0])
    : 'https://via.placeholder.com/300x200?text=Không+có+hình';

  return (
    <div className={`hotel-card${!bookable ? ' hotel-card--unavailable' : ''}`}>
      <div className="hotel-image">
        <img src={imageUrl} alt={hotel.name} />
        {!bookable && (
          <span className={`hotel-card__status-badge hotel-card__status-badge--${status}`}>
            {getHotelStatusLabel(status)}
          </span>
        )}
        <HotelWishlistButton
          hotelId={hotel._id}
          isWishlisted={isWishlisted}
          onWishlistedChange={onWishlistedChange}
        />
      </div>
      <div className="hotel-info">
        <h3>{hotel.name}</h3>
        <div className="hotel-rating">
          {Array(hotel.starRating || 0).fill().map((_, i) => (
            <span key={i} className="star">★</span>
          ))}
        </div>
        <p className="hotel-address">
          {hotel.address 
            ? `${hotel.address.number || ''} ${hotel.address.street || ''}, ${hotel.address.city || ''}`
            : 'Địa chỉ không có'}
        </p>
        {statusMessage ? (
          <p className="hotel-card__status-hint" role="status">{statusMessage}</p>
        ) : null}
        <Link to={hotelDetailPath(hotel._id)} className="view-details-btn">
          {bookable ? 'Xem chi tiết' : 'Xem thông tin'}
        </Link>
      </div>
    </div>
  );
};

