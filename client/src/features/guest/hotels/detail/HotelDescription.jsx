import './HotelDescription.scss';

/**
 * Hotel Description Component
 * Hiển thị giới thiệu về khách sạn
 */
const HotelDescription = ({ hotel }) => {
  if (!hotel || !hotel.description) return null;

  return (
    <div className="hotel-description">
      <h2>Giới thiệu</h2>
      <p>{hotel.description}</p>
    </div>
  );
};

export default HotelDescription;

