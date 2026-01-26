import { useState, useEffect } from 'react';
import { FaDollarSign, FaBed, FaExclamationCircle } from 'react-icons/fa';
import { ownerDashboardAPI } from '@/apis/owner/dashboard';
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
  const [stats, setStats] = useState({
    todayRevenue: 0,
    availableRooms: 0,
    totalRooms: 0,
    roomsToClean: 0,
    brokenRooms: 0
  });
  const [hotel, setHotel] = useState(null);
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [roomOccupancy, setRoomOccupancy] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [statsData, hotelData, revenueData, occupancyData, tasksData] = await Promise.allSettled([
          ownerDashboardAPI.getStats(),
          ownerDashboardAPI.getHotelInfo(),
          ownerDashboardAPI.getWeeklyRevenue(),
          ownerDashboardAPI.getRoomOccupancy(),
          ownerDashboardAPI.getTodayTasks()
        ]);

        if (statsData.status === 'fulfilled') {
          setStats(statsData.value);
        }

        if (hotelData.status === 'fulfilled') {
          setHotel(hotelData.value);
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
  }, []);

  const handleEditHotel = () => {
    setShowEditDialog(true);
  };

  const handleEditSuccess = () => {
    // Refresh hotel data after successful update
    const fetchHotelData = async () => {
      try {
        const hotelData = await ownerDashboardAPI.getHotelInfo();
        setHotel(hotelData);
      } catch (err) {
        console.error('Error refreshing hotel data:', err);
      }
    };
    fetchHotelData();
  };

  const formatRevenue = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    return amount.toLocaleString('vi-VN');
  };

  const getCurrentDate = () => {
    const today = new Date();
    const days = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[today.getDay()];
    const date = today.toLocaleDateString('vi-VN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    return `${dayName}, ${date}`;
  };

  if (loading) {
    return <div className="owner-dashboard-loading">Đang tải...</div>;
  }

  return (
    <div className="owner-dashboard">
      {/* Today's Overview Section */}
      <div className="today-overview">
        <HotelInfoCard 
          hotel={hotel}
          onEdit={handleEditHotel}
        />
      </div>

      {/* Edit Hotel Dialog */}
      {hotel && (
        <EditHotelDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          hotel={hotel}
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

