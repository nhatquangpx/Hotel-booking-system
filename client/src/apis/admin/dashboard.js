import api from '../config/axios';

export const adminDashboardAPI = {
  getStats: async () => {
    const res = await api.get('/admin/dashboard/stats');
    return res.data;
  }
};
export const adminRecentActivitiesAPI = {
  getRecentActivities: async () => {
    const res = await api.get('/admin/dashboard/recent-activities');
    return res.data;
  }
};