import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
// Auth APIs
export const authAPI = {
  login: (username, password) =>
    apiClient.post('/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (data) => apiClient.post('/auth/register', data),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
};

// Employee APIs
export const employeeAPI = {
  getAll: () => apiClient.get('/employees'),
  getById: (id) => apiClient.get(`/employees/${id}`),
  getMyProfile: () => apiClient.get('/employees/me'),
  create: (data) => apiClient.post('/employees', data),
  update: (id, data) => apiClient.put(`/employees/${id}`, data),
  updateMyProfile: (data) => apiClient.put('/employees/me', data),
  changePassword: (data) => apiClient.post('/employees/me/change-password', data),
  resetPassword: (id) => apiClient.post(`/employees/${id}/reset-password`),
  delete: (id) => apiClient.delete(`/employees/${id}`),
};

// Attendance APIs
export const attendanceAPI = {
  checkIn: () => apiClient.post('/attendance/check-in'),
  checkOut: () => apiClient.post('/attendance/check-out'),
  getToday: () => apiClient.get('/attendance/today'),
  getHistory: (params) => apiClient.get('/attendance/history', { params }),
  getAllToday: () => apiClient.get('/attendance/all-today'),
};

// Project APIs
export const projectAPI = {
  getAll: () => apiClient.get('/projects'),
  getById: (id) => apiClient.get(`/projects/${id}`),
  create: (data) => apiClient.post('/projects', data),
  update: (id, data) => apiClient.put(`/projects/${id}`, data),
  delete: (id) => apiClient.delete(`/projects/${id}`),
};

// Task APIs
export const taskAPI = {
  getAll: (params) => apiClient.get('/tasks', { params }),
  getById: (id) => apiClient.get(`/tasks/${id}`),
  getMyTasks: () => apiClient.get('/tasks/my-tasks'),
  create: (data) => apiClient.post('/tasks', data),
  update: (id, data) => apiClient.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => apiClient.patch(`/tasks/${id}/status`, { status }),
  delete: (id) => apiClient.delete(`/tasks/${id}`),
};

// Blog APIs
export const blogAPI = {
  getAll: (params) => apiClient.get('/blogs', { params }),
  getById: (id) => apiClient.get(`/blogs/${id}`),
  create: (data) => apiClient.post('/blogs', data),
  update: (id, data) => apiClient.put(`/blogs/${id}`, data),
  updateStatus: (id, status) => apiClient.patch(`/blogs/${id}/status`, { status }),
  delete: (id) => apiClient.delete(`/blogs/${id}`),
};

// Notification APIs
export const notificationAPI = {
  getAll: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.post('/notifications/mark-all-read'),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getEmployeeStats: () => apiClient.get('/dashboard/employee-stats'),
};

// Settings APIs
export const settingsAPI = {
  getAll: () => apiClient.get('/settings'),
  getByKey: (key) => apiClient.get(`/settings/${key}`),
  update: (key, value) => apiClient.put(`/settings/${key}`, { value }),
};

export default apiClient;