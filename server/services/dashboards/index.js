/**
 * Dashboard Service
 * Consolidated exports for all dashboard service functions
 */

// Core functions
const {
  DAYS_OF_WEEK,
  DASHBOARD_TZ,
  getOwnerHotelIds,
  getScopedHotelIdsForOwner,
  getTodayDateRange,
  getDateRangeForDay,
  calculateRevenueInRange,
  calculateRevenueForOccupiedRooms,
} = require('./core');

// Owner dashboard services
const {
  getDashboardStats: getOwnerDashboardStats,
  getWeeklyRevenue,
  getRoomOccupancy,
  getTodayTasks
} = require('./owner');

// Admin dashboard services
const {
  getDashboardStats: getAdminDashboardStats,
  getRecentActivities,
  getRevenueByHotel,
  getPendingContacts,
} = require('./admin');

// Staff dashboard services
const { getStaffDashboard } = require('./staff');

module.exports = {
  // Core functions
  DAYS_OF_WEEK,
  DASHBOARD_TZ,
  getOwnerHotelIds,
  getScopedHotelIdsForOwner,
  getTodayDateRange,
  getDateRangeForDay,
  calculateRevenueInRange,
  calculateRevenueForOccupiedRooms,
  
  // Owner services
  getOwnerDashboardStats,
  getWeeklyRevenue,
  getRoomOccupancy,
  getTodayTasks,
  
  // Admin services
  getAdminDashboardStats,
  getRecentActivities,
  getRevenueByHotel,
  getPendingContacts,

  // Staff services
  getStaffDashboard,
};
