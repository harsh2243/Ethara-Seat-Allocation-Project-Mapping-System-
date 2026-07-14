import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT Token from LocalStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ethara_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Employee APIs
export const getEmployees = (params) => api.get('/employees', { params });
export const getEmployee = (id) => api.get(`/employees/${id}`);
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deactivateEmployee = (id) => api.delete(`/employees/${id}`);

// Project APIs
export const getProjects = () => api.get('/projects');
export const getProjectEmployees = (id) => api.get(`/projects/${id}/employees`);

// Seat APIs
export const getSeats = (params) => api.get('/seats', { params });
export const getAvailableSeats = (params) => api.get('/seats/available', { params });
export const allocateSeat = (employeeId, seatId) => api.post('/seats/allocate', { employee_id: employeeId, seat_id: seatId });
export const releaseSeat = (data) => api.post('/seats/release', data);
export const updateSeatStatus = (id, status) => api.put(`/seats/${id}`, { status });

// Dashboard APIs
export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getProjectUtilization = () => api.get('/dashboard/project-utilization');
export const getFloorUtilization = () => api.get('/dashboard/floor-utilization');

// AI Assistant APIs
export const askAIAssistant = (query) => api.post('/ai/query', { query });

export default api;
