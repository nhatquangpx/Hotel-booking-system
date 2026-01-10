import './HotelContact.scss';

/**
 * Hotel Contact Component
 * Hiển thị thông tin liên hệ của khách sạn
 */
const HotelContact = ({ hotel }) => {
  if (!hotel || !hotel.contactInfo) return null;

  return (
    <div className="hotel-contact">
      <h2>Thông tin liên hệ</h2>
      <div className="contact-details">
        <div className="contact-item">
          <h3>Số điện thoại</h3>
          <p>{hotel.contactInfo.phone}</p>
        </div>
        <div className="contact-item">
          <h3>Email</h3>
          <p>{hotel.contactInfo.email}</p>
        </div>
      </div>
    </div>
  );
};

export default HotelContact;

