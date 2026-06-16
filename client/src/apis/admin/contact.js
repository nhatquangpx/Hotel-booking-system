import api from '../config/axios';

const adminContactAPI = {
  getContactMessages: async ({
    page = 1,
    limit = 20,
    isRead = '',
    replied = '',
    searchName = '',
    searchEmail = '',
    searchPhone = '',
    searchSubject = '',
    searchContent = '',
  } = {}) => {
    try {
      const params = { page, limit };
      if (isRead === 'true' || isRead === 'false') params.isRead = isRead;
      if (replied === 'true' || replied === 'false') params.replied = replied;
      if (searchName) params.searchName = searchName;
      if (searchEmail) params.searchEmail = searchEmail;
      if (searchPhone) params.searchPhone = searchPhone;
      if (searchSubject) params.searchSubject = searchSubject;
      if (searchContent) params.searchContent = searchContent;
      const response = await api.get('/admin/contact-messages', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await api.put(`/admin/contact-messages/${id}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  replyMessage: async (id, replyMessage) => {
    try {
      const response = await api.post(`/admin/contact-messages/${id}/reply`, { replyMessage });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteMessage: async (id) => {
    try {
      const response = await api.delete(`/admin/contact-messages/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default adminContactAPI;
