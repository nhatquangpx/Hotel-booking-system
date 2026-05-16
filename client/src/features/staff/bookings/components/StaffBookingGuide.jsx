import OwnerGuideCollapsible from '@/features/owner/components/OwnerGuideCollapsible';

const StaffBookingGuide = () => (
  <OwnerGuideCollapsible label="Hướng dẫn đặt phòng — bấm để xem">
    <div className="booking-guide-card">
      <div className="booking-guide-card__intro">
        <h3>Hướng dẫn xử lý đặt phòng</h3>
        <p>
          Xem toàn bộ lịch sử đơn tại khách sạn, tìm đơn theo khách hoặc mã đơn, và thực hiện check-in /
          check-out khi khách đến hoặc rời đi.
        </p>
      </div>
      <div className="booking-guide-grid">
        <div className="booking-guide-item">
          <span className="booking-guide-item__step">1</span>
          <div>
            <strong>Tìm và lọc đơn</strong>
            <p>
              Dùng nút &quot;Hôm nay check-in/out&quot; để xem đơn nhận hoặc trả phòng trong ngày, kèm bộ lọc và
              tìm kiếm khi cần.
            </p>
          </div>
        </div>
        <div className="booking-guide-item">
          <span className="booking-guide-item__step">2</span>
          <div>
            <strong>Xem chi tiết đơn</strong>
            <p>
              Bấm &quot;Xem chi tiết&quot; để kiểm tra thông tin khách, phòng, thanh toán và minh chứng (nếu có).
            </p>
          </div>
        </div>
        <div className="booking-guide-item">
          <span className="booking-guide-item__step">3</span>
          <div>
            <strong>Check-in / Check-out</strong>
            <p>
              Chỉ thực hiện khi đơn đã thanh toán: check-in khi khách nhận phòng, check-out khi khách trả phòng.
            </p>
          </div>
        </div>
      </div>
    </div>
  </OwnerGuideCollapsible>
);

export default StaffBookingGuide;
