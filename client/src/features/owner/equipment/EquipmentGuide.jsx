import React from 'react';
import OwnerGuideCollapsible from '@/features/owner/components/OwnerGuideCollapsible';

/**
 * Khối hướng dẫn (thu gọn mặc định).
 */
const EquipmentGuide = () => (
  <OwnerGuideCollapsible label="Hướng dẫn trang thiết bị — bấm để xem">
    <div className="owner-equipment-page__guide-card">
      <div className="owner-equipment-page__guide-intro">
        <h3>Hướng dẫn quản lý trang thiết bị</h3>
        <p>
          Theo dõi thiết bị trong từng phòng (điều hòa, TV, minibar…) độc lập với tiện ích/dịch vụ hiển thị cho
          khách. Bạn chủ động thêm — không tự sinh từ danh sách tiện ích phòng.
        </p>
      </div>
      <div className="owner-equipment-page__guide-grid">
        <div className="owner-equipment-page__guide-item">
          <span className="owner-equipment-page__guide-step">1</span>
          <div>
            <strong>Chọn phòng cần theo dõi</strong>
            <p>Nhấn vào một phòng để mở danh sách thiết bị và thao tác trên từng mục.</p>
          </div>
        </div>
        <div className="owner-equipment-page__guide-item">
          <span className="owner-equipment-page__guide-step">2</span>
          <div>
            <strong>Thêm thiết bị thủ công</strong>
            <p>Nhập tên thiết bị, chọn trạng thái ban đầu rồi bấm Thêm — chỉ dùng cho đồ vật trong phòng.</p>
          </div>
        </div>
        <div className="owner-equipment-page__guide-item">
          <span className="owner-equipment-page__guide-step">3</span>
          <div>
            <strong>Cập nhật trạng thái vận hành</strong>
            <p>Chuyển giữa Hoạt động, Đang sửa chữa hoặc Hỏng khi có sự cố hoặc sau bảo trì.</p>
          </div>
        </div>
        <div className="owner-equipment-page__guide-item">
          <span className="owner-equipment-page__guide-step">4</span>
          <div>
            <strong>Đổi tên hoặc xóa mục</strong>
            <p>
              Dùng biểu tượng bút để sửa tên (Enter hoặc rời ô để lưu), thùng rác để mở hộp thoại xác nhận rồi xóa
              khỏi danh sách.
            </p>
          </div>
        </div>
        <div className="owner-equipment-page__guide-item">
          <span className="owner-equipment-page__guide-step">5</span>
          <div>
            <strong>Báo bên sửa chữa qua email</strong>
            <p>
              Bấm &quot;Báo bên sửa chữa&quot;: trong hộp thoại, nhập/lưu email đối tác bảo trì, chọn thiết bị Hỏng
              (mặc định chọn hết) rồi gửi — hệ thống gửi email tự động.
            </p>
          </div>
        </div>
      </div>
    </div>
  </OwnerGuideCollapsible>
);

export default EquipmentGuide;
