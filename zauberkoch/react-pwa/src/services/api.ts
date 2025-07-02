// Optimized API service layer for Zauberkoch React PWA

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { 
  User, 
  Recipe, 
  UserSettings, 
  FoodPreference, 
  ApiLog,
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RecipeGenerationRequest,
  RecipeGenerationResponse,
  ReferralCode
} from '../types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const API_TIMEOUT = 30000; // 30 seconds for AI requests

class ApiService {
  private api: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage on initialization
    this.loadAuthToken();
    
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearAuthToken();
          window.location.href = '/login';
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  // Authentication methods
  private loadAuthToken(): void {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.authToken = token;
    }
  }

  private setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem('auth_token', token);
  }

  private clearAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem('auth_token');
  }

  // Error handling
  private handleError(error: AxiosError): Error {
    const message = (error.response?.data as any)?.message || error.message || 'An unexpected error occurred';
    return new Error(message);
  }

  // Generic API call wrapper
  private async apiCall<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: any
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.request({
        method,
        url: endpoint,
        data,
        params,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Authentication API
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.apiCall<AuthResponse>('POST', '/auth/login', credentials);
    this.setAuthToken(response.token);
    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.apiCall<AuthResponse>('POST', '/auth/register', userData);
    this.setAuthToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.apiCall('POST', '/auth/logout');
    } finally {
      this.clearAuthToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.apiCall<User>('GET', '/auth/me');
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await this.apiCall<AuthResponse>('POST', '/auth/refresh');
    this.setAuthToken(response.token);
    return response;
  }

  // Google OAuth2
  getGoogleOAuthUrl(): string {
    return `${API_BASE_URL}/oauth2/authorization/google`;
  }

  async handleOAuthCallback(code: string, state: string): Promise<AuthResponse> {
    const response = await this.apiCall<AuthResponse>('POST', '/oauth2/callback', {
      code,
      state,
    });
    this.setAuthToken(response.token);
    return response;
  }

  // User management
  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    return this.apiCall<User>('PUT', `/users/${userId}`, userData);
  }

  async deleteUser(userId: number): Promise<void> {
    await this.apiCall('DELETE', `/users/${userId}`);
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.apiCall('POST', '/users/change-password', {
      oldPassword,
      newPassword,
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.apiCall('POST', '/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.apiCall('POST', '/auth/reset-password', {
      token,
      newPassword,
    });
  }

  // Recipe management
  async getRecipes(page = 1, limit = 20): Promise<PaginatedResponse<Recipe>> {
    return this.apiCall<PaginatedResponse<Recipe>>('GET', '/recipes', null, {
      page,
      limit,
    });
  }

  async getRecipe(id: number): Promise<Recipe> {
    return this.apiCall<Recipe>('GET', `/recipes/${id}`);
  }

  async getFavoriteRecipes(): Promise<Recipe[]> {
    return this.apiCall<Recipe[]>('GET', '/recipes/favorites');
  }

  async toggleRecipeFavorite(recipeId: number): Promise<Recipe> {
    return this.apiCall<Recipe>('POST', `/recipes/${recipeId}/favorite`);
  }

  async updateRecipe(recipeId: number, recipeData: Partial<Recipe>): Promise<Recipe> {
    return this.apiCall<Recipe>('PUT', `/recipes/${recipeId}`, recipeData);
  }

  async deleteRecipe(recipeId: number): Promise<void> {
    await this.apiCall('DELETE', `/recipes/${recipeId}`);
  }

  async searchRecipes(query: string, filters?: any): Promise<Recipe[]> {
    return this.apiCall<Recipe[]>('GET', '/recipes/search', null, {
      q: query,
      ...filters,
    });
  }

  async shareRecipe(recipeId: number): Promise<{ shareUrl: string; qrCode: string }> {
    return this.apiCall('POST', `/recipes/${recipeId}/share`);
  }

  async getSharedRecipe(uuid: string): Promise<Recipe> {
    return this.apiCall<Recipe>('GET', `/recipes/shared/${uuid}`);
  }

  // AI Recipe Generation
  async generateRecipe(request: RecipeGenerationRequest): Promise<RecipeGenerationResponse> {
    return this.apiCall<RecipeGenerationResponse>('POST', '/ai/generate-recipe', request);
  }

  async generateCocktail(request: RecipeGenerationRequest): Promise<RecipeGenerationResponse> {
    return this.apiCall<RecipeGenerationResponse>('POST', '/ai/generate-cocktail', request);
  }

  async regenerateRecipe(apiLogId: number): Promise<RecipeGenerationResponse> {
    return this.apiCall<RecipeGenerationResponse>('POST', `/ai/regenerate/${apiLogId}`);
  }

  // User Settings
  async getUserSettings(): Promise<UserSettings> {
    return this.apiCall<UserSettings>('GET', '/users/settings');
  }

  async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    return this.apiCall<UserSettings>('PUT', '/users/settings', settings);
  }

  // Food Preferences
  async getFoodPreferences(): Promise<FoodPreference[]> {
    return this.apiCall<FoodPreference[]>('GET', '/users/food-preferences');
  }

  async updateFoodPreferences(preferences: FoodPreference[]): Promise<FoodPreference[]> {
    return this.apiCall<FoodPreference[]>('PUT', '/users/food-preferences', preferences);
  }

  async addFoodPreference(name: string, liked: boolean): Promise<FoodPreference> {
    return this.apiCall<FoodPreference>('POST', '/users/food-preferences', {
      name,
      liked,
    });
  }

  async deleteFoodPreference(id: number): Promise<void> {
    await this.apiCall('DELETE', `/users/food-preferences/${id}`);
  }

  // API History
  async getApiHistory(page = 1, limit = 20): Promise<PaginatedResponse<ApiLog>> {
    return this.apiCall<PaginatedResponse<ApiLog>>('GET', '/api-logs', null, {
      page,
      limit,
    });
  }

  async getApiLog(id: number): Promise<ApiLog> {
    return this.apiCall<ApiLog>('GET', `/api-logs/${id}`);
  }

  async toggleApiLogStar(id: number): Promise<ApiLog> {
    return this.apiCall<ApiLog>('POST', `/api-logs/${id}/star`);
  }

  async deleteApiLog(id: number): Promise<void> {
    await this.apiCall('DELETE', `/api-logs/${id}`);
  }

  // Referral System
  async getReferralCodes(): Promise<ReferralCode[]> {
    return this.apiCall<ReferralCode[]>('GET', '/referrals');
  }

  async createReferralCode(): Promise<ReferralCode> {
    return this.apiCall<ReferralCode>('POST', '/referrals');
  }

  async validateReferralCode(code: string): Promise<{ valid: boolean; bonusTime: number }> {
    return this.apiCall('POST', '/referrals/validate', { code });
  }

  // Premium/Subscription
  async getSubscriptionStatus(): Promise<{ active: boolean; expiresAt?: string }> {
    return this.apiCall('GET', '/subscription/status');
  }

  async createPayPalSubscription(planId: string): Promise<{ subscriptionId: string; approvalUrl: string }> {
    return this.apiCall('POST', '/subscription/paypal/create', { planId });
  }

  async confirmPayPalSubscription(subscriptionId: string): Promise<void> {
    await this.apiCall('POST', '/subscription/paypal/confirm', { subscriptionId });
  }

  async cancelSubscription(): Promise<void> {
    await this.apiCall('POST', '/subscription/cancel');
  }

  // Admin API
  async getUsers(page = 1, limit = 50): Promise<PaginatedResponse<User>> {
    return this.apiCall<PaginatedResponse<User>>('GET', '/admin/users', null, {
      page,
      limit,
    });
  }

  async getApiStats(): Promise<{ totalUsers: number; totalApiCalls: number; todayApiCalls: number }> {
    return this.apiCall('GET', '/admin/stats');
  }

  async updateUserAdmin(userId: number, adminData: Partial<User>): Promise<User> {
    return this.apiCall<User>('PUT', `/admin/users/${userId}`, adminData);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return this.authToken !== null;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  // Rate limiting check
  async checkRateLimit(): Promise<{ remaining: number; resetAt: string }> {
    return this.apiCall('GET', '/rate-limit');
  }

  // Health check
  async healthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    return this.apiCall('GET', '/health');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;