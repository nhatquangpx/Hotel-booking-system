import './HotelContact.scss';

/**
 * Hotel Contact Component
 * Hiển thị thông tin liên hệ của khách sạn
 */
const HotelContact = ({ hotel, variant = 'default' }) => {
  if (!hotel || !hotel.contactInfo) return null;

  const address = hotel.address
    ? [hotel.address.number, hotel.address.street, hotel.address.city].filter(Boolean).join(' ')
    : null;
  const isSidebar = variant === 'sidebar';

  return (
    <div className={`hotel-contact${isSidebar ? ' hotel-contact--sidebar' : ''}`}>
      <h2>Thông tin liên hệ</h2>
      <div className="contact-details">
        {address ? (
          <div className="contact-item">
            <h3>Địa chỉ</h3>
            <p>{address}</p>
          </div>
        ) : null}
        <div className="contact-item">
          <h3>Số điện thoại</h3>
          <p>{hotel.contactInfo.phone}</p>
        </div>
        <div className="contact-item">
          <h3>Email</h3>
          <p>{hotel.contactInfo.email}</p>
        </div>
        {hotel.contactInfo.website ? (
          <div className="contact-item">
            <h3>Website</h3>
            <p>{hotel.contactInfo.website}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default HotelContact;
