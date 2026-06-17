import OwnerGuideCollapsible from '@/features/owner/components/OwnerGuideCollapsible';

const StaffBookingGuide = () => (
  <OwnerGuideCollapsible label="Hướng dẫn đặt phòng — bấm để xem">
    <div className="booking-guide-card">
      <div className="booking-guide-card__intro">
        <h3>Hướng dẫn xử lý đặt phòng</h3>
        <p>
          Tab <strong>Cần xử lý</strong> gom đơn check-in/check-out hôm nay; tab <strong>Tất cả đơn</strong> dùng
          để tra cứu lịch sử và tìm đơn cụ thể.
        </p>
      </div>
      <div className="booking-guide-grid">
        <div className="booking-guide-item">
          <span className="booking-guide-item__step">1</span>
          <div>
            <strong>Check-in / Check-out hôm nay</strong>
            <p>
              Mở tab Cần xử lý để xem đơn cần nhận hoặc trả phòng trong ngày. Dùng bộ lọc loại để thu hẹp danh
              sách.
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
            <strong>Thực hiện check-in / check-out</strong>
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
