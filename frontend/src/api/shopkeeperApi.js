import api from './axiosClient.js';

export const shopkeeperApi = {
  shop: () => api.get('/shopkeeper/shop'),
  dashboard: () => api.get('/shopkeeper/dashboard'),
  categories: () => api.get('/shopkeeper/categories'),
  products: (params) => api.get('/shopkeeper/products', { params }),
  createProduct: (payload) => api.post('/shopkeeper/products', payload),
  updateProduct: (productId, payload) => api.put(`/shopkeeper/products/${productId}`, payload),
  updateStock: (productId, payload) => api.patch(`/shopkeeper/products/${productId}/stock`, payload),
  deleteProduct: (productId) => api.delete(`/shopkeeper/products/${productId}`),
  orders: (params) => api.get('/shopkeeper/orders', { params }),
  order: (orderId) => api.get(`/shopkeeper/orders/${orderId}`),
  updateOrderStatus: (orderId, payload) => api.patch(`/shopkeeper/orders/${orderId}/status`, payload),
};
