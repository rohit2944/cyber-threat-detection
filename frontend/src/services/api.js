import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout for model training operations
});

export const checkHealth = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

export const getDashboard = async () => {
  const response = await api.get('/api/dashboard');
  return response.data;
};

export const predictThreat = async (payload) => {
  const response = await api.post('/api/predict', payload);
  return response.data;
};

export const getLiveFlow = async () => {
  const response = await api.get('/api/live-flow');
  return response.data;
};

export const uploadDataset = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/upload-dataset', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const trainModel = async (payload = {}) => {
  const response = await api.post('/api/train', payload);
  return response.data;
};

export const getModelPerformance = async () => {
  const response = await api.get('/api/model-performance');
  return response.data;
};

export const getDatasetInfo = async () => {
  const response = await api.get('/api/dataset-info');
  return response.data;
};

export const getHistory = async (params = {}) => {
  const response = await api.get('/api/history', { params });
  return response.data;
};

export const deleteHistoryItem = async (id) => {
  const response = await api.delete(`/api/history/${id}`);
  return response.data;
};

export const clearHistory = async () => {
  const response = await api.delete('/api/history');
  return response.data;
};

export const getExportHistoryUrl = () => {
  return `${API_BASE_URL}/api/history/export`;
};

export default api;
