import api, { handleApiError } from "../config/axios";

const guestContactAPI = {
  submitContact: async (payload) => {
    try {
      const response = await api.post("/guest/contact", payload);
      return response.data;
    } catch (error) {
      handleApiError(error, "Không thể gửi liên hệ. Vui lòng thử lại sau.");
    }
  },
};

export default guestContactAPI;
