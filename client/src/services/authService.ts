import api, { tokenManager } from './api';
import { User, LoginResponse, AuthVerifyResponse } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const response: LoginResponse = await api.post('/api/auth/signin', { email, password });
    // Token is automatically stored by the API interceptor
    return response.user;
  },

  async signup(fullName: string, email: string, password: string): Promise<User> {
    const response: LoginResponse = await api.post('/api/auth/signup', { fullName, email, password });
    // Token is automatically stored by the API interceptor
    return response.user;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/signout');
    // Remove token from local storage
    tokenManager.removeToken();
  },

  async verifyAuth(): Promise<AuthVerifyResponse> {
    try {
      const response: AuthVerifyResponse = await api.get('/api/auth/verify');
      return response;
    } catch (error) {
      // If verification fails, remove invalid token
      tokenManager.removeToken();
      throw error;
    }
  },

  async getCurrentUser(): Promise<User> {
    const response: User = await api.get('/api/auth/me');
    return response;
  },

  async updateTimezone(timezone: string): Promise<void> {
    await api.post('/api/auth/update-timezone', { timezone });
  },

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> {
    await api.post('/api/auth/change-password', { 
      currentPassword, 
      newPassword, 
      confirmPassword 
    });
  }
};

export default authService;