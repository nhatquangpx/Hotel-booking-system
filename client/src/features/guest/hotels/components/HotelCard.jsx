import { Link } from 'react-router-dom';
import { getImageUrl } from '@/constants/images';
import './HotelCard.scss';

/**
 * Hotel Card component
 * Displays hotel information in a card format
 */
export const HotelCard = ({ hotel }) => {
  if (!hotel) return null;

  const imageUrl = hotel.images && hotel.images[0] 
    ? getImageUrl(hotel.images[0])
    : 'https://via.placeholder.com/300x200?text=Không+có+hình';

  return (
    <div className="hotel-card">
      <div className="hotel-image">
        <img src={imageUrl} alt={hotel.name} />
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
        <Link to={`/hotels/${hotel._id}`} className="view-details-btn">
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
};

