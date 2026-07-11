import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FaDollarSign,
  FaBed,
  FaWrench,
  FaTags,
  FaCommentDots,
  FaFileExcel,
  FaClipboardCheck,
} from 'react-icons/fa';
import { ownerDashboardAPI, CHART_PERIODS } from '@/apis/owner/dashboard';
import { useOwnerHotel } from '@/features/owner/context/OwnerHotelContext';
import MetricCard from '../../components/MetricCard';
import HotelInfoCard from '../../components/HotelInfoCard';
import EditHotelDialog from '../../components/EditHotelDialog';
import PoliciesCard from '../../components/PoliciesCard';
import RevenueChart from '../../components/RevenueChart';
import RoomOccupancyChart from '../../components/RoomOccupancyChart';
import TaskList from './TaskList';
import './OwnerDashboard.scss';

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

const emptyChartMeta = {
  series: [],
  label: '',
  canGoNext: false,
};

/**
 * Owner Dashboard component
 * Displays overview statistics, charts, and tasks for hotel owner
 */
export const OwnerDashboard = () => {
  const { selectedHotelId, selectedHotel, refreshHotels, loading: hotelsLoading } =
    useOwnerHotel();

  const [stats, setStats] = useState({
    todayRevenue: 0,
    availableRooms: 0,
    totalRooms: 0,
    equipmentAttentionCount: 0,
    activeSalesCount: 0,
    reviewsAwaitingReply: 0,
    bookingsAwaitingAction: 0,
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [reportRange, setReportRange] = useState(defaultReportRange);
  const [exportingReport, setExportingReport] = useState(false);

  const [revenuePeriod, setRevenuePeriod] = useState(CHART_PERIODS.WEEK);
  const [revenueOffset, setRevenueOffset] = useState(0);
  const [revenueChart, setRevenueChart] = useState(emptyChartMeta);
  const [revenueLoading, setRevenueLoading] = useState(false);

  const [occupancyPeriod, setOccupancyPeriod] = useState(CHART_PERIODS.WEEK);
  const [occupancyOffset, setOccupancyOffset] = useState(0);
  const [occupancyRoomType, setOccupancyRoomType] = useState('');
  const [occupancyChart, setOccupancyChart] = useState(emptyChartMeta);
  const [occupancyLoading, setOccupancyLoading] = useState(false);

  useEffect(() => {
    setRevenueOffset(0);
    setOccupancyOffset(0);
    setOccupancyRoomType('');
  }, [selectedHotelId]);

  useEffect(() => {
    if (hotelsLoading) return;

    const fetchBase = async () => {
      try {
        setLoading(true);
        if (!selectedHotelId) {
          setStats({
            todayRevenue: 0,
            availableRooms: 0,
            totalRooms: 0,
            equipmentAttentionCount: 0,
            activeSalesCount: 0,
            reviewsAwaitingReply: 0,
            bookingsAwaitingAction: 0,
          });
          setTasks([]);
          return;
        }

        const [statsData, tasksData] = await Promise.allSettled([
          ownerDashboardAPI.getStats(selectedHotelId),
          ownerDashboardAPI.getTodayTasks(selectedHotelId),
        ]);

        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (tasksData.status === 'fulfilled') setTasks(tasksData.value);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBase();
  }, [selectedHotelId, hotelsLoading]);

  useEffect(() => {
    if (hotelsLoading || !selectedHotelId) {
      setRevenueChart(emptyChartMeta);
      return;
    }

    let cancelled = false;
    const fetchRevenue = async () => {
      try {
        setRevenueLoading(true);
        const data = await ownerDashboardAPI.getWeeklyRevenue(selectedHotelId, {
          period: revenuePeriod,
          offset: revenueOffset,
        });
        if (cancelled) return;
        setRevenueChart({
          series: data.series || [],
          label: data.label || '',
          canGoNext: Boolean(data.canGoNext),
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setRevenueChart(emptyChartMeta);
          toast.error(err?.message || 'Không tải được biểu đồ doanh thu');
        }
      } finally {
        if (!cancelled) setRevenueLoading(false);
      }
    };

    fetchRevenue();
    return () => {
      cancelled = true;
    };
  }, [selectedHotelId, hotelsLoading, revenuePeriod, revenueOffset]);

  useEffect(() => {
    if (hotelsLoading || !selectedHotelId) {
      setOccupancyChart(emptyChartMeta);
      return;
    }

    let cancelled = false;
    const fetchOccupancy = async () => {
      try {
        setOccupancyLoading(true);
        const data = await ownerDashboardAPI.getRoomOccupancy(selectedHotelId, {
          period: occupancyPeriod,
          offset: occupancyOffset,
          roomType: occupancyRoomType,
        });
        if (cancelled) return;
        setOccupancyChart({
          series: data.series || [],
          label: data.label || '',
          canGoNext: Boolean(data.canGoNext),
          roomTypeLabel: data.roomTypeLabel,
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setOccupancyChart(emptyChartMeta);
          toast.error(err?.message || 'Không tải được biểu đồ tỷ lệ phòng có khách');
        }
      } finally {
        if (!cancelled) setOccupancyLoading(false);
      }
    };

    fetchOccupancy();
    return () => {
      cancelled = true;
    };
  }, [
    selectedHotelId,
    hotelsLoading,
    occupancyPeriod,
    occupancyOffset,
    occupancyRoomType,
  ]);

  const handleEditHotel = () => {
    setShowEditDialog(true);
  };

  const handleEditSuccess = async () => {
    await refreshHotels();
  };

  const handleExportReport = useCallback(async () => {
    if (!selectedHotelId || exportingReport) return;
    setExportingReport(true);
    try {
      await ownerDashboardAPI.downloadReportExcel({
        hotelId: selectedHotelId,
        from: reportRange.from,
        to: reportRange.to,
      });
      toast.success('Đã tải báo cáo Excel thành công');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Không thể xuất báo cáo');
    } finally {
      setExportingReport(false);
    }
  }, [selectedHotelId, exportingReport, reportRange.from, reportRange.to]);

  const formatRevenue = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    return amount.toLocaleString('vi-VN');
  };

  if (hotelsLoading || loading) {
    return <div className="owner-dashboard-loading">Đang tải...</div>;
  }

  return (
    <div className="owner-dashboard">
      <div className="today-overview">
        <HotelInfoCard hotel={selectedHotel} onEdit={handleEditHotel} />
      </div>

      {selectedHotel && (
        <EditHotelDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          hotel={selectedHotel}
          onSuccess={handleEditSuccess}
        />
      )}

      <PoliciesCard />

      {selectedHotelId && (
        <div className="owner-report-export">
          <div className="owner-report-export__head">
            <h3 className="owner-report-export__title">Xuất báo cáo Excel</h3>
            <div className="owner-report-export__hint">
              <p>
                <strong>Hướng dẫn:</strong> chọn khoảng thời gian cần xem, rồi bấm « Tải file Excel ». Báo cáo áp
                dụng cho <strong>khách sạn đang chọn</strong> trên thanh chọn khách sạn.
              </p>
              <p>
                <strong>Nội dung file:</strong> có 2 sheet —
              </p>
              <ul>
                <li>
                  <em>Tổng quan</em>: tổng doanh thu, số đêm đã bán, tỷ lệ phòng có khách, giá trung bình mỗi
                  đêm, doanh thu trung bình mỗi phòng/ngày; kèm bảng theo từng ngày và xu hướng đơn đặt mới.
                </li>
                <li>
                  <em>Theo loại phòng</em>: so sánh từng loại phòng (doanh thu, đêm bán, tỷ lệ có khách, đóng góp
                  doanh thu).
                </li>
              </ul>
              <p>
                File Excel có mục <strong>Chú thích</strong> giải thích cách đọc từng cột. Doanh thu được chia
                theo <strong>từng đêm khách ở</strong>, chỉ tính đơn <strong>đã thanh toán</strong>.
              </p>
            </div>
          </div>
          <div className="owner-report-export__controls">
            <label className="owner-report-export__field">
              <span>Từ ngày</span>
              <input
                type="date"
                value={reportRange.from}
                onChange={(e) => setReportRange((r) => ({ ...r, from: e.target.value }))}
              />
            </label>
            <label className="owner-report-export__field">
              <span>Đến ngày</span>
              <input
                type="date"
                value={reportRange.to}
                onChange={(e) => setReportRange((r) => ({ ...r, to: e.target.value }))}
              />
            </label>
            <button
              type="button"
              className="owner-report-export__btn"
              disabled={exportingReport}
              onClick={handleExportReport}
            >
              <FaFileExcel aria-hidden />
              {exportingReport ? 'Đang tải…' : 'Tải file Excel'}
            </button>
          </div>
        </div>
      )}

      <div className="metrics-grid">
        <MetricCard
          title="Doanh thu hôm nay"
          value={formatRevenue(stats.todayRevenue)}
          icon={FaDollarSign}
          iconColor="green"
          to="/owner/bookings"
        />
        <MetricCard
          title="Đơn cần xử lý"
          value={stats.bookingsAwaitingAction ?? 0}
          icon={FaClipboardCheck}
          iconColor="red"
          to={stats.bookingsAwaitingAction > 0 ? '/owner/bookings?filter=action' : undefined}
        />
        <MetricCard
          title="Phòng trống"
          value={`${stats.availableRooms}/${stats.totalRooms}`}
          icon={FaBed}
          iconColor="blue"
          to="/owner/rooms"
        />
        <MetricCard
          title="Thiết bị cần xử lý"
          value={stats.equipmentAttentionCount}
          icon={FaWrench}
          iconColor="yellow"
          to="/owner/equipment"
        />
        <MetricCard
          title="Sale đang chạy"
          value={stats.activeSalesCount}
          icon={FaTags}
          iconColor="default"
          to="/owner/sale"
        />
        <MetricCard
          title="Đánh giá chưa phản hồi"
          value={stats.reviewsAwaitingReply}
          icon={FaCommentDots}
          iconColor="red"
          to="/owner/reviews"
        />
      </div>

      <div className="charts-grid">
        <RevenueChart
          data={revenueChart.series}
          period={revenuePeriod}
          offset={revenueOffset}
          periodLabel={revenueChart.label}
          canGoNext={revenueChart.canGoNext}
          loading={revenueLoading}
          onPeriodChange={(p) => {
            setRevenuePeriod(p);
            setRevenueOffset(0);
          }}
          onOffsetChange={setRevenueOffset}
        />
        <RoomOccupancyChart
          data={occupancyChart.series}
          period={occupancyPeriod}
          offset={occupancyOffset}
          periodLabel={occupancyChart.label}
          canGoNext={occupancyChart.canGoNext}
          roomType={occupancyRoomType}
          roomTypeLabel={occupancyChart.roomTypeLabel || 'Tất cả loại phòng'}
          loading={occupancyLoading}
          onPeriodChange={(p) => {
            setOccupancyPeriod(p);
            setOccupancyOffset(0);
          }}
          onOffsetChange={setOccupancyOffset}
          onRoomTypeChange={setOccupancyRoomType}
        />
      </div>

      <TaskList tasks={tasks} />
    </div>
  );
};
