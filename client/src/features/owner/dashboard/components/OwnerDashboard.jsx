import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaDollarSign, FaBed, FaWrench, FaTags, FaCommentDots, FaFileExcel, FaClipboardCheck } from 'react-icons/fa';
import { ownerDashboardAPI } from '@/apis/owner/dashboard';
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
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [roomOccupancy, setRoomOccupancy] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [reportRange, setReportRange] = useState(defaultReportRange);
  const [exportingReport, setExportingReport] = useState(false);

  useEffect(() => {
    if (hotelsLoading) {
      return;
    }

    const fetchDashboardData = async () => {
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
          setWeeklyRevenue([]);
          setRoomOccupancy([]);
          setTasks([]);
          return;
        }

        const [statsData, revenueData, occupancyData, tasksData] = await Promise.allSettled([
          ownerDashboardAPI.getStats(selectedHotelId),
          ownerDashboardAPI.getWeeklyRevenue(selectedHotelId),
          ownerDashboardAPI.getRoomOccupancy(selectedHotelId),
          ownerDashboardAPI.getTodayTasks(selectedHotelId)
        ]);

        if (statsData.status === 'fulfilled') {
          setStats(statsData.value);
        }

        if (revenueData.status === 'fulfilled') {
          setWeeklyRevenue(revenueData.value);
        }

        if (occupancyData.status === 'fulfilled') {
          setRoomOccupancy(occupancyData.value);
        }

        if (tasksData.status === 'fulfilled') {
          setTasks(tasksData.value);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedHotelId, hotelsLoading]);

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
        to: reportRange.to
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
      {/* Today's Overview Section */}
      <div className="today-overview">
        <HotelInfoCard 
          hotel={selectedHotel}
          onEdit={handleEditHotel}
        />
      </div>

      {/* Edit Hotel Dialog */}
      {selectedHotel && (
        <EditHotelDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          hotel={selectedHotel}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Policies Section */}
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
                <strong>Nội dung file:</strong> có hai phần — <em>Tổng hợp kỳ</em> (tổng số phòng, doanh thu, số
                đơn và đêm phòng bán trong cả kỳ) và <em>Chi tiết theo ngày</em>. Doanh thu và số đơn được tính
                theo <strong>ngày tạo đơn</strong>, chỉ các đơn <strong>đã thanh toán</strong>; cột đêm phòng bán
                phản ánh số đêm đã bán trong từng ngày của kỳ báo cáo.
              </p>
            </div>
          </div>
          <div className="owner-report-export__controls">
            <label className="owner-report-export__field">
              <span>Từ ngày</span>
              <input
                type="date"
                value={reportRange.from}
                onChange={(e) =>
                  setReportRange((r) => ({ ...r, from: e.target.value }))
                }
              />
            </label>
            <label className="owner-report-export__field">
              <span>Đến ngày</span>
              <input
                type="date"
                value={reportRange.to}
                onChange={(e) =>
                  setReportRange((r) => ({ ...r, to: e.target.value }))
                }
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

      {/* Metrics Cards */}
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

      {/* Charts Section */}
      <div className="charts-grid">
        <RevenueChart data={weeklyRevenue} />
        <RoomOccupancyChart data={roomOccupancy} />
      </div>

      {/* Today's Tasks Section */}
      <TaskList tasks={tasks} />
    </div>
  );
};
