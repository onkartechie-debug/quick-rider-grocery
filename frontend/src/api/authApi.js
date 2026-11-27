import api from './axiosClient.js';

export const authApi = {
  csrf: () => api.get('/auth/csrf'),
  me: () => api.get('/auth/me'),
  login: (payload) => api.post('/auth/login', payload),
  requestOtp: (phone) => api.post('/auth/otp/request', { phone }),
  verifyOtp: (phone, otp) => api.post('/auth/otp/verify', { phone, otp }),
  register: (payload) => api.post('/auth/register', payload),
  logout: () => api.post('/auth/logout'),
};
