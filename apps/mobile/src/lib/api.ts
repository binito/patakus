import axios from 'axios';
import { getToken } from './auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.176:3001';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — the auth store listener will handle redirect
    }
    return Promise.reject(error);
  },
);
