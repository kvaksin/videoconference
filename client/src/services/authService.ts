import api from './api';
import { User, LoginResponse, AuthVerifyResponse } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const response: LoginResponse = await api.post('/api/auth/signin', { email, password });
    return response.user;
  },

  async signup(fullName: string, email: string, password: string): Promise<User> {
    const response: LoginResponse = await api.post('/api/auth/signup', { fullName, email, password });
    return response.user;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/signout');
  },

  async verifyAuth(): Promise<AuthVerifyResponse> {
    const response: AuthVerifyResponse = await api.get('/api/auth/verify');
    return response;
  },

  async getCurrentUser(): Promise<User> {
    const response: User = await api.get('/api/auth/me');
    return response;
  },

  async updateTimezone(timezone: string): Promise<void> {
    await api.post('/api/auth/update-timezone', { timezone });
  }
};

export default authService;