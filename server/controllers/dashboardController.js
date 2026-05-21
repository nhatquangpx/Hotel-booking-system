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
    const hotelId = req.query.hotelId || null;
    const stats = await dashboardService.getOwnerDashboardStats(req.user.id, hotelId);
    res.json(stats);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê dashboard owner:", error);
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi lấy thống kê', error: error.message });
  }
};

exports.getOwnerRevenueStats = async (req, res) => {
  try {
    const hotelId = req.query.hotelId || null;
    const revenueData = await dashboardService.getWeeklyRevenue(req.user.id, hotelId);
    res.json(revenueData);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê doanh thu owner:", error);
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi lấy thống kê doanh thu', error: error.message });
  }
};

exports.getOwnerRoomStats = async (req, res) => {
  try {
    const hotelId = req.query.hotelId || null;
    const occupancyData = await dashboardService.getRoomOccupancy(req.user.id, hotelId);
    res.json(occupancyData);
  } catch (error) {
    console.error("Lỗi khi lấy thống kê phòng owner:", error);
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi lấy thống kê phòng', error: error.message });
  }
};

exports.getOwnerTodayTasks = async (req, res) => {
  try {
    const hotelId = req.query.hotelId || null;
    const tasks = await dashboardService.getTodayTasks(req.user.id, hotelId);
    res.json(tasks);
  } catch (error) {
    console.error("Lỗi khi lấy công việc hôm nay owner:", error);
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi lấy công việc hôm nay', error: error.message });
  }
};

/** Staff: tổng quan dashboard (stats + panels). */
exports.getStaffDashboard = async (req, res) => {
  try {
    if (!req.staffHotelId) {
      return res.status(403).json({
        message: "Tài khoản nhân viên chưa được gán khách sạn",
      });
    }
    const data = await dashboardService.getStaffDashboard(req.staffHotelId);
    res.json(data);
  } catch (error) {
    console.error("Lỗi khi lấy dashboard staff:", error);
    if (error.statusCode === 403) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi lấy dữ liệu tổng quan", error: error.message });
  }
};
