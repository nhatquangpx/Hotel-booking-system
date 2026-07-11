import api, { handleApiError } from '../config/axios';
import { unwrapPaginated } from '@/shared/utils/core/paginationResponse';

export const staffAddonAPI = {
  list: async (params = {}) => {
    try {
      const response = await api.get('/staff/addon-services', { params });
      return unwrapPaginated(response.data, 'addons');
    } catch (error) {
      handleApiError(error, 'Không tải được danh sách dịch vụ');
    }
  },

  create: async (body) => {
    try {
      const response = await api.post('/staff/addon-services', body);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không tạo được dịch vụ');
    }
  },

  update: async (id, body) => {
    try {
      const response = await api.put(`/staff/addon-services/${id}`, body);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không cập nhật được dịch vụ');
    }
  },

  setStatus: async (id, isActive) => {
    try {
      const response = await api.patch(`/staff/addon-services/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không đổi trạng thái được');
    }
  },
};

export default staffAddonAPI;
