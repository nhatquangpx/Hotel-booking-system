import api from '../config/axios';

export const ownerPricingAPI = {
  /**
   * @param {{ hotelId?: string, days?: number }} params
   */
  getDynamicPricing: async (params = {}) => {
    const search = new URLSearchParams();
    if (params.hotelId) search.set('hotelId', params.hotelId);
    if (params.days) search.set('days', String(params.days));
    const q = search.toString();
    const url = q ? `/owner/pricing/dynamic?${q}` : '/owner/pricing/dynamic';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Áp dụng giá TB gợi ý trong kỳ cho mọi phòng loại đó (regular, discount=0).
   * @param {{ hotelId: string, roomType: string, days: number }} body
   */
  applySuggestedPrices: async (body) => {
    const response = await api.post('/owner/pricing/apply-suggested', body);
    return response.data;
  },
};

export default ownerPricingAPI;
