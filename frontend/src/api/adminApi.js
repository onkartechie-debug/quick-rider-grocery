import api from './axiosClient.js';

export const adminApi = {
  metrics: () => api.get('/admin/metrics'),
  listShops: (params) => api.get('/admin/shops', { params }),
  getShop: (shopId) => api.get(`/admin/shops/${shopId}`),
  createShop: (payload) => api.post('/admin/shops', payload),
  updateShop: (shopId, payload) => api.put(`/admin/shops/${shopId}`, payload),
  setShopStatus: (shopId, active) => api.patch(`/admin/shops/${shopId}/status`, { active }),
  availableShopkeepers: () => api.get('/admin/shopkeepers/available'),
};
