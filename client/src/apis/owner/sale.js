import api, { handleApiError } from '../config/axios';
import { unwrapPaginated } from '@/shared/utils/paginationResponse';

export const ownerSaleAPI = {
  list: async (params = {}) => {
    try {
      const response = await api.get('/owner/sales', { params });
      return unwrapPaginated(response.data, 'sales');
    } catch (error) {
      handleApiError(error, 'Không tải được danh sách sale');
    }
  },

  create: async (body) => {
    try {
      const response = await api.post('/owner/sales', body);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không tạo được chương trình sale');
    }
  },

  update: async (id, body) => {
    try {
      const response = await api.put(`/owner/sales/${id}`, body);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không cập nhật được chương trình sale');
    }
  },

  setStatus: async (id, isActive) => {
    try {
      const response = await api.patch(`/owner/sales/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không đổi trạng thái được');
    }
  },

  close: async (id) => {
    try {
      const response = await api.delete(`/owner/sales/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không đóng được chương trình sale');
    }
  },
};

export default ownerSaleAPI;
