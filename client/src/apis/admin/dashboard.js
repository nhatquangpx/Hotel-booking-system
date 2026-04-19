import api from '../config/axios';

export const adminDashboardAPI = {
  getStats: async () => {
    const res = await api.get('/admin/dashboard/stats');
    return res.data;
  },

  /** Xuất báo cáo Excel (.xlsx). */
  downloadReportExcel: async ({ hotelId, from, to }) => {
    const params = { from, to };
    if (hotelId) params.hotelId = hotelId;
    try {
      const response = await api.get('/admin/reports/export', {
        params,
        responseType: 'blob'
      });
      const blob = response.data;
      let filename = 'bao-cao-admin.xlsx';
      const cd = response.headers['content-disposition'];
      if (cd) {
        const m = cd.match(/filename="([^"]+)"/);
        if (m) filename = m[1];
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        const j = JSON.parse(text);
        throw new Error(j.message || 'Lỗi xuất báo cáo');
      }
      throw error;
    }
  }
};
export const adminRecentActivitiesAPI = {
  getRecentActivities: async () => {
    const res = await api.get('/admin/dashboard/recent-activities');
    return res.data;
  }
};