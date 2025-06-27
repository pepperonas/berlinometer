import { api } from './api';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  ResetPasswordRequest,
  UpdateProfileRequest 
} from '@/types/auth.types';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, we should clear local state
      console.error('Logout error:', error);
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  }

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  }

  async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await api.get('/auth/me');
    return response.data.data;
  }

  async updateProfile(userData: UpdateProfileRequest): Promise<AuthResponse['user']> {
    const response = await api.put('/auth/profile', userData);
    return response.data.data;
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  getStoredUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }

  getStoredToken() {
    return localStorage.getItem('token');
  }

  getStoredRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  clearStoredAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}

export const authService = new AuthService();