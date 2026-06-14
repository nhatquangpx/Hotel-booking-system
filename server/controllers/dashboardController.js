const dashboardApi = require("../services/dashboards/dashboardApiService");
const { runService } = require("../lib/http/controllerHelper");

exports.getAdminStats = (req, res) =>
  runService(res, () => dashboardApi.getAdminStats({ adminId: req.user?.id }));

exports.getRecentActivities = (req, res) =>
  runService(res, () => dashboardApi.getRecentActivities({ adminId: req.user?.id }));

exports.getOwnerDashboardStats = (req, res) =>
  runService(res, () =>
    dashboardApi.getOwnerDashboardStats({
      ownerId: req.user.id,
      hotelId: req.query.hotelId,
    })
  );

exports.getOwnerRevenueStats = (req, res) =>
  runService(res, () =>
    dashboardApi.getOwnerRevenueStats({
      ownerId: req.user.id,
      hotelId: req.query.hotelId,
    })
  );

exports.getOwnerRoomStats = (req, res) =>
  runService(res, () =>
    dashboardApi.getOwnerRoomStats({
      ownerId: req.user.id,
      hotelId: req.query.hotelId,
    })
  );

exports.getOwnerTodayTasks = (req, res) =>
  runService(res, () =>
    dashboardApi.getOwnerTodayTasks({
      ownerId: req.user.id,
      hotelId: req.query.hotelId,
    })
  );

exports.getStaffDashboard = (req, res) =>
  runService(res, () => dashboardApi.getStaffDashboard({ staffHotelId: req.staffHotelId }));
