const dashboardService = require('../services/dashboards');

// Admin Dashboard Controllers
exports.getAdminStats = async (req, res) => {
  try {
    console.log(`Admin ${req.user?.id} đang lấy thống kê tổng quan`);
    const stats = await dashboardService.getAdminDashboardStats();
    console.log(`Thống kê: ${stats.totalUsers} users, ${stats.totalHotels} hotels, ${stats.totalRooms} rooms, ${stats.totalBookings} bookings, ${stats.revenue} revenue`);
    res.json(stats);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê:", error);
    res.status(500).json({ message: 'Lỗi lấy thống kê', error: error.message });
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    console.log(`Admin ${req.user?.id} đang lấy hoạt động gần đây`);
    const activities = await dashboardService.getRecentActivities();
    console.log(`Đã tìm thấy ${activities.length} hoạt động gần đây`);
    res.json(activities);
  } catch (error) {
    console.error("Lỗi khi lấy hoạt động gần đây:", error);
    res.status(500).json({ message: 'Lỗi lấy hoạt động gần đây', error: error.message });
  }
};

// Owner Dashboard Controllers
exports.getOwnerDashboardStats = async (req, res) => {
  try {
    const stats = await dashboardService.getOwnerDashboardStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê dashboard owner:", error);
    res.status(500).json({ message: 'Lỗi lấy thống kê', error: error.message });
  }
};

exports.getOwnerRevenueStats = async (req, res) => {
  try {
    const revenueData = await dashboardService.getWeeklyRevenue(req.user.id);
    res.json(revenueData);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê doanh thu owner:", error);
    res.status(500).json({ message: 'Lỗi lấy thống kê doanh thu', error: error.message });
  }
};

exports.getOwnerRoomStats = async (req, res) => {
  try {
    const occupancyData = await dashboardService.getRoomOccupancy(req.user.id);
    res.json(occupancyData);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê phòng owner:", error);
    res.status(500).json({ message: 'Lỗi lấy thống kê phòng', error: error.message });
  }
};

exports.getOwnerTodayTasks = async (req, res) => {
  try {
    const tasks = await dashboardService.getTodayTasks(req.user.id);
    res.json(tasks);
  } catch (error) {
    console.error("Lỗi khi lấy công việc hôm nay owner:", error);
    res.status(500).json({ message: 'Lỗi lấy công việc hôm nay', error: error.message });
  }
};
