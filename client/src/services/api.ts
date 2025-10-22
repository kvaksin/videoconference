import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { FetchAPIOptions } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Token storage
const TOKEN_KEY = 'auth_token';

// Token management
export const tokenManager = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
};

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
    // Add JWT token to Authorization header if available
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Check if response contains a token and store it
    const responseData = response.data;
    if (responseData && responseData.token) {
      tokenManager.setToken(responseData.token);
    }
    return response.data;
  },
  (error: AxiosError) => {
    // Handle 401 errors by removing invalid token
    if (error.response?.status === 401) {
      tokenManager.removeToken();
    }
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