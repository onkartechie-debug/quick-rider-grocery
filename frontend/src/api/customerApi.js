import api from './axiosClient.js';

/** Anonymous storefront endpoints. */
export const publicApi = {
  categories: () => api.get('/public/categories'),
  shops: (params) => api.get('/public/shops', { params }),
  shop: (shopId) => api.get(`/public/shops/${shopId}`),
  products: (shopId, params) => api.get(`/public/shops/${shopId}/products`, { params }),
};

/** Logged-in customer endpoints. */
export const customerApi = {
  validateCart: (payload) => api.post('/customer/cart/validate', payload),
  placeOrder: (payload) => api.post('/customer/orders', payload),
  orders: (params) => api.get('/customer/orders', { params }),
  order: (orderId) => api.get(`/customer/orders/${orderId}`),
  cancelOrder: (orderId, reason) => api.post(`/customer/orders/${orderId}/cancel`, { reason }),
  addresses: () => api.get('/customer/addresses'),
  createAddress: (payload) => api.post('/customer/addresses', payload),
  updateAddress: (addressId, payload) => api.put(`/customer/addresses/${addressId}`, payload),
  makeDefaultAddress: (addressId) => api.patch(`/customer/addresses/${addressId}/default`),
  deleteAddress: (addressId) => api.delete(`/customer/addresses/${addressId}`),
};
