import { getEffectiveRefundMinDaysBeforeCheckIn } from '@/shared/utils';
import './HotelPolicies.scss';

/**
 * Hotel Policies Component
 * Hiển thị chính sách nhận phòng và trả phòng
 */
const HotelPolicies = ({ hotel }) => {
  if (!hotel) return null;

  const p = hotel.policies || {};
  const refundDays = getEffectiveRefundMinDaysBeforeCheckIn(p);

  return (
    <div className="hotel-policies">
      <h2>Chính sách</h2>
      <div className="policy-details">
        <div className="policy-item">
          <h3>Nhận phòng</h3>
          <p>{p.checkInTime || '14:00'}</p>
        </div>
        <div className="policy-item">
          <h3>Trả phòng</h3>
          <p>{p.checkOutTime || '12:00'}</p>
        </div>
        <div className="policy-item">
          <h3>Hủy đặt &amp; hoàn tiền</h3>
          <p>
            <strong>Đã thanh toán:</strong> để được hoàn tiền khi hủy (QR hoặc VNPay), thường cần còn ít nhất{' '}
            <strong>{refundDays}</strong> ngày (theo lịch) trước ngày nhận phòng — theo cấu hình khách sạn. Tiền hoàn
            được chuyển khoản thủ công vào tài khoản bạn cung cấp khi hủy. Nếu hủy khi không còn đủ số ngày đó, đơn
            vẫn có thể hủy nhưng <strong>không áp dụng hoàn tiền</strong> theo quy định chung.
          </p>
          <p>
            <strong>Chưa thanh toán:</strong> bạn vẫn có thể gửi hủy đơn trên hệ thống (khi còn cho phép). Con số{' '}
            <strong>{refundDays}</strong> ngày ở trên <strong>không</strong> dùng để xét hoàn tiền vì chưa có khoản
            thanh toán để hoàn.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HotelPolicies;
