import { useState, useEffect } from 'react';
import { FaDollarSign, FaBed, FaExclamationCircle } from 'react-icons/fa';
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
    roomsToClean: 0,
    brokenRooms: 0
  });
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [roomOccupancy, setRoomOccupancy] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

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
            roomsToClean: 0,
            brokenRooms: 0
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

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Doanh thu hôm nay"
          value={formatRevenue(stats.todayRevenue)}
          icon={FaDollarSign}
          iconColor="green"
        />
        <MetricCard
          title="Phòng trống"
          value={`${stats.availableRooms}/${stats.totalRooms}`}
          icon={FaBed}
          iconColor="blue"
        />
        <MetricCard
          title="Phòng cần dọn"
          value={stats.roomsToClean}
          icon={FaExclamationCircle}
          iconColor="yellow"
        />
        <MetricCard
          title="Phòng hỏng"
          value={stats.brokenRooms}
          icon={FaExclamationCircle}
          iconColor="red"
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
