const dashboardService = require("./index");
const { ServiceError } = require("../../lib/http/serviceError");

async function getAdminStats({ adminId }) {
  console.log(`Admin ${adminId} đang lấy thống kê tổng quan`);
  const stats = await dashboardService.getAdminDashboardStats();
  console.log(
    `Thống kê: ${stats.totalUsers} users, ${stats.totalHotels} hotels, ${stats.totalRooms} rooms, ${stats.totalBookings} bookings, ${stats.revenue} revenue`
  );
  return { status: 200, body: stats };
}

async function getRecentActivities({ adminId }) {
  console.log(`Admin ${adminId} đang lấy hoạt động gần đây`);
  const activities = await dashboardService.getRecentActivities();
  console.log(`Đã tìm thấy ${activities.length} hoạt động gần đây`);
  return { status: 200, body: activities };
}

async function getOwnerDashboardStats({ ownerId, hotelId }) {
  const body = await dashboardService.getOwnerDashboardStats(ownerId, hotelId || null);
  return { status: 200, body };
}

async function getOwnerRevenueStats({ ownerId, hotelId }) {
  const body = await dashboardService.getWeeklyRevenue(ownerId, hotelId || null);
  return { status: 200, body };
}

async function getOwnerRoomStats({ ownerId, hotelId }) {
  const body = await dashboardService.getRoomOccupancy(ownerId, hotelId || null);
  return { status: 200, body };
}

async function getOwnerTodayTasks({ ownerId, hotelId }) {
  const body = await dashboardService.getTodayTasks(ownerId, hotelId || null);
  return { status: 200, body };
}

async function getStaffDashboard({ staffHotelId }) {
  if (!staffHotelId) {
    throw new ServiceError(403, "Tài khoản nhân viên chưa được gán khách sạn");
  }
  const body = await dashboardService.getStaffDashboard(staffHotelId);
  return { status: 200, body };
}

module.exports = {
  getAdminStats,
  getRecentActivities,
  getOwnerDashboardStats,
  getOwnerRevenueStats,
  getOwnerRoomStats,
  getOwnerTodayTasks,
  getStaffDashboard,
};
