export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'dpo' | 'user';
  organizationId?: number;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}