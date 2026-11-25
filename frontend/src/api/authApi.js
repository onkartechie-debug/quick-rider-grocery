import api from './axiosClient.js';

export const authApi = {
  csrf: () => api.get('/auth/csrf'),
  me: () => api.get('/auth/me'),
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  logout: () => api.post('/auth/logout'),
};
