import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState } from '@/store';
import { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout as logoutAction,
  clearError,
} from '@/store/authSlice';
import { authService } from '@/services/auth.service';
import { LoginRequest, RegisterRequest } from '@/types/auth.types';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      dispatch(loginStart());
      const response = await authService.login(credentials);
      dispatch(loginSuccess(response));
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login fehlgeschlagen';
      dispatch(loginFailure(errorMessage));
      throw error;
    }
  }, [dispatch]);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      dispatch(loginStart());
      const response = await authService.register(userData);
      dispatch(loginSuccess(response));
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registrierung fehlgeschlagen';
      dispatch(loginFailure(errorMessage));
      throw error;
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(logoutAction());
    }
  }, [dispatch]);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await authService.forgotPassword(email);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Fehler beim Zurücksetzen des Passworts';
      throw new Error(errorMessage);
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      await authService.resetPassword(token, newPassword);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Fehler beim Zurücksetzen des Passworts';
      throw new Error(errorMessage);
    }
  }, []);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const refreshToken = useCallback(async () => {
    try {
      const response = await authService.refreshToken();
      dispatch(loginSuccess(response));
      return response;
    } catch (error) {
      dispatch(logoutAction());
      throw error;
    }
  }, [dispatch]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    clearError: clearAuthError,
    refreshToken,
  };
};