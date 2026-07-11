import api, { handleApiError } from '../config/axios';
import { unwrapPaginated } from '@/shared/utils/core/paginationResponse';

export const ownerAddonAPI = {
  list: async (params = {}) => {
    try {
      const response = await api.get('/owner/addon-services', { params });
      return unwrapPaginated(response.data, 'addons');
    } catch (error) {
      handleApiError(error, 'Không tải được danh sách dịch vụ');
    }
  },

  create: async (body) => {
    try {
      const response = await api.post('/owner/addon-services', body);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không tạo được dịch vụ');
    }
  },

  update: async (id, body) => {
    try {
      const response = await api.put(`/owner/addon-services/${id}`, body);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không cập nhật được dịch vụ');
    }
  },

  setStatus: async (id, isActive) => {
    try {
      const response = await api.patch(`/owner/addon-services/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không đổi trạng thái được');
    }
  },
};

export default ownerAddonAPI;
