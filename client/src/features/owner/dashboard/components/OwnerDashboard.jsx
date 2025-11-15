import { useState, useEffect } from 'react';
import { FaDollarSign, FaBed, FaExclamationCircle } from 'react-icons/fa';
import { ownerDashboardAPI } from '@/apis/owner/dashboard';
import MetricCard from '../../components/MetricCard';
import HotelInfoCard from '../../components/HotelInfoCard';
import PoliciesCard from '../../components/PoliciesCard';
import RevenueChart from '../../components/RevenueChart';
import RoomOccupancyChart from '../../components/RoomOccupancyChart';
import TaskList from '../../components/TaskList';
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
        // Set default data for demo
        setStats({
          todayRevenue: 7800000,
          availableRooms: 8,
          totalRooms: 20,
          roomsToClean: 5,
          brokenRooms: 2
        });
        setWeeklyRevenue([
          { day: 'T2', value: 4500000 },
          { day: 'T3', value: 5200000 },
          { day: 'T4', value: 3800000 },
          { day: 'T5', value: 6100000 },
          { day: 'T6', value: 7200000 },
          { day: 'T7', value: 8500000 },
          { day: 'CN', value: 7800000 },
        ]);
        setRoomOccupancy([
          { day: 'T2', value: 6000000 },
          { day: 'T3', value: 7000000 },
          { day: 'T4', value: 6500000 },
          { day: 'T5', value: 8000000 },
          { day: 'T6', value: 9000000 },
          { day: 'T7', value: 9500000 },
          { day: 'CN', value: 8500000 },
        ]);
        setTasks([
          { id: 1, type: 'cleaning', text: 'Dọn phòng 101, 102, 105', urgent: true },
          { id: 2, type: 'checkin', text: 'Khách đến - Phòng 203', time: '14:00' },
          { id: 3, type: 'maintenance', text: 'Sửa vòi nước phòng 304', urgent: true },
          { id: 4, type: 'checkout', text: 'Check-out phòng 201', time: '12:00' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
        <h1 className="overview-title">Tổng quan hôm nay</h1>
        <p className="overview-date">{getCurrentDate()}</p>
        
        <HotelInfoCard 
          hotel={hotel}
          onEdit={() => console.log('Edit hotel')}
        />
      </div>

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

