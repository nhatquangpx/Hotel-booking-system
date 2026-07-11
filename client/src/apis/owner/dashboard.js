import api from '../config/axios';

const hotelParams = (hotelId, extra = {}) => {
  const params = { ...extra };
  if (hotelId) params.hotelId = hotelId;
  return { params };
};

export const CHART_PERIODS = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
};

export const ownerDashboardAPI = {
  getStats: async (hotelId) => {
    try {
      const response = await api.get('/owner/dashboard/stats', hotelParams(hotelId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Doanh thu theo kỳ.
   * @param {string} hotelId
   * @param {{ period?: string, offset?: number }} opts
   */
  getWeeklyRevenue: async (hotelId, opts = {}) => {
    try {
      const response = await api.get(
        '/owner/dashboard/revenue',
        hotelParams(hotelId, {
          period: opts.period || 'week',
          offset: opts.offset ?? 0,
        })
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Công suất phòng theo kỳ + loại phòng.
   * @param {string} hotelId
   * @param {{ period?: string, offset?: number, roomType?: string }} opts
   */
  getRoomOccupancy: async (hotelId, opts = {}) => {
    try {
      const response = await api.get(
        '/owner/dashboard/rooms',
        hotelParams(hotelId, {
          period: opts.period || 'week',
          offset: opts.offset ?? 0,
          ...(opts.roomType ? { roomType: opts.roomType } : {}),
        })
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getTodayTasks: async (hotelId) => {
    try {
      const response = await api.get('/owner/dashboard/tasks', hotelParams(hotelId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  downloadReportExcel: async ({ hotelId, from, to }) => {
    const params = { from, to };
    if (hotelId) params.hotelId = hotelId;
    try {
      const response = await api.get('/owner/reports/export', {
        params,
        responseType: 'blob',
      });
      const blob = response.data;
      let filename = 'bao-cao-owner.xlsx';
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
  },

  getHotelInfo: async (hotelId) => {
    try {
      const response = await api.get('/owner/hotels');
      const hotels = response.data;
      if (!Array.isArray(hotels) || hotels.length === 0) {
        return null;
      }
      if (hotelId) {
        const hit = hotels.find((h) => String(h._id) === String(hotelId));
        return hit || hotels[0];
      }
      return hotels[0];
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default ownerDashboardAPI;
