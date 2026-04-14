import { FaStar } from 'react-icons/fa';
import { HotelWishlistButton } from '../components/HotelWishlistButton';
import './HotelHeader.scss';

/**
 * Hotel Header Component
 * Hiển thị tên, sao đánh giá và địa chỉ khách sạn
 */
const HotelHeader = ({ hotel, isWishlisted, onWishlistedChange }) => {
  if (!hotel) return null;

  return (
    <div className="hotel-header">
      <div className="hotel-title-row">
        <h1>{hotel.name}</h1>
        <HotelWishlistButton
          hotelId={hotel._id}
          isWishlisted={isWishlisted}
          onWishlistedChange={onWishlistedChange}
          inline
        />
      </div>
      <div className="hotel-rating">
        {Array(hotel.starRating).fill().map((_, i) => (
          <FaStar key={i} className="star" />
        ))}
      </div>
      <p className="hotel-address">
        {`${hotel.address.number} ${hotel.address.street}, ${hotel.address.city}`}
      </p>
    </div>
  );
};

export default HotelHeader;

