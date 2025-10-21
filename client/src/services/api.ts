import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { FetchAPIOptions } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error: AxiosError) => {
    const message = (error.response?.data as any)?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Wrapper function for easier usage
export const fetchAPI = async <T = any>(url: string, options: FetchAPIOptions = {}): Promise<T> => {
  try {
    if (options.method && options.method !== 'GET') {
      return await api({
        url,
        method: options.method,
        data: options.body ? JSON.parse(options.body) : undefined,
        headers: { ...options.headers }
      });
    } else {
      return await api.get(url);
    }
  } catch (error) {
    throw error;
  }
};

export default api;