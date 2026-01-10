import './HotelPolicies.scss';

/**
 * Hotel Policies Component
 * Hiển thị chính sách nhận phòng và trả phòng
 */
const HotelPolicies = ({ hotel }) => {
  if (!hotel || !hotel.policies) return null;

  return (
    <div className="hotel-policies">
      <h2>Chính sách</h2>
      <div className="policy-details">
        <div className="policy-item">
          <h3>Nhận phòng</h3>
          <p>{hotel.policies.checkInTime}</p>
        </div>
        <div className="policy-item">
          <h3>Trả phòng</h3>
          <p>{hotel.policies.checkOutTime}</p>
        </div>
      </div>
    </div>
  );
};

export default HotelPolicies;

