import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaFileExcel } from 'react-icons/fa';
import { adminDashboardAPI } from '@/apis/admin/dashboard';

const formatYmd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const defaultReportRange = () => {
  const to = new Date();
  to.setHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setDate(from.getDate() - 6);
  return { from: formatYmd(from), to: formatYmd(to) };
};

const BookingRevenueReportExport = ({ hotels = [] }) => {
  const [reportHotelId, setReportHotelId] = useState('');
  const [reportRange, setReportRange] = useState(defaultReportRange);
  const [exportingReport, setExportingReport] = useState(false);

  const handleExportReport = useCallback(async () => {
    if (exportingReport) return;
    setExportingReport(true);
    try {
      await adminDashboardAPI.downloadReportExcel({
        hotelId: reportHotelId || undefined,
        from: reportRange.from,
        to: reportRange.to,
      });
      toast.success('Đã tải báo cáo Excel thành công');
    } catch (err) {
      toast.error(err?.message || 'Không thể xuất báo cáo');
    } finally {
      setExportingReport(false);
    }
  }, [exportingReport, reportHotelId, reportRange.from, reportRange.to]);

  return (
    <div className="admin-report-export">
      <div className="admin-report-export__head">
        <h3 className="admin-report-export__title">Xuất báo cáo doanh thu</h3>
        <div className="admin-report-export__hint">
          <p>
            Chọn <strong>khách sạn</strong> (hoặc để « Tất cả khách sạn » để gộp toàn hệ thống), chọn khoảng
            ngày, rồi bấm « Tải file Excel ».
          </p>
          <p>
            <strong>Nội dung file:</strong> sheet <em>Tổng quan</em> (doanh thu, số đêm đã bán, tỷ lệ phòng có
            khách, giá TB mỗi đêm, doanh thu TB mỗi phòng/ngày; chi tiết từng ngày + đơn đặt mới) và sheet{' '}
            <em>Theo loại phòng</em> (so sánh hiệu quả từng loại). File có mục <strong>Chú thích</strong>. Doanh
            thu tính theo <strong>từng đêm khách ở</strong>, chỉ đơn <strong>đã thanh toán</strong>.
          </p>
        </div>
      </div>
      <div className="admin-report-export__controls">
        <label className="admin-report-export__field">
          <span>Khách sạn</span>
          <select value={reportHotelId} onChange={(e) => setReportHotelId(e.target.value)}>
            <option value="">Tất cả khách sạn</option>
            {hotels.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name || h._id}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-report-export__field">
          <span>Từ ngày</span>
          <input
            type="date"
            value={reportRange.from}
            onChange={(e) => setReportRange((r) => ({ ...r, from: e.target.value }))}
          />
        </label>
        <label className="admin-report-export__field">
          <span>Đến ngày</span>
          <input
            type="date"
            value={reportRange.to}
            onChange={(e) => setReportRange((r) => ({ ...r, to: e.target.value }))}
          />
        </label>
        <button
          type="button"
          className="admin-report-export__btn"
          disabled={exportingReport}
          onClick={handleExportReport}
        >
          <FaFileExcel aria-hidden />
          {exportingReport ? 'Đang tải…' : 'Tải file Excel'}
        </button>
      </div>
    </div>
  );
};

export default BookingRevenueReportExport;
