// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Optional for security - not always returned
  firstName: string;
  lastName: string;
  language: 'de' | 'en';
  premiumExpiration: Date | null;
  subscriptionId: string | null;
  verified: boolean;
  googleOauth: boolean;
  referralCode: string;
  created: Date;
  lastSeen: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  isLoading: boolean;
  isPremium: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  language: 'de' | 'en';
  referralCode?: string;
}

// Recipe Types
export interface Recipe {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category?: string;
  preparationTime?: string;
  cookingTime?: string;
  cost?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  servings: number;
  instructions: string | string[];
  tips?: string;
  cookingTips?: string;
  servingTips?: string;
  importantNotes?: string;
  ingredients: RecipeIngredient[];
  isFavorite: boolean;
  alcoholContent?: string;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  created: Date;
  updated: Date;
}

export interface RecipeIngredient {
  name: string;
  amount?: string;
  unit?: string;
  preparation?: string;
  category?: string;
}

// User Settings for Recipe Generation
export interface UserSettings {
  id: string;
  userId: string;
  // Food preferences
  rgType: 'all' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo';
  rgGoal: 'healthy' | 'muscle' | 'weight_loss' | 'comfort' | 'quick';
  rgApi: 'openai' | 'deepseek' | 'grok';
  // Sliders (1-5 scale)
  sliderDiversity: number;
  sliderDuration: number; // cooking time preference
  sliderCost: number; // budget preference
  sliderPortions: number;
  // Checkboxes for goals
  cbxGetThin: boolean;
  cbxGetHeavy: boolean;
  cbxGetMuscles: boolean;
  cbxGetHealthy: boolean;
  // Drink settings
  rgTypeDrink: 'all' | 'alcoholic' | 'non_alcoholic' | 'low_alcohol';
  rgStyleDrink: 'classic' | 'modern' | 'exotic' | 'simple';
  sliderDiversityDrink: number;
  sliderComplexityDrink: number;
  sliderAlcoholContentDrink: number;
  sliderGlassesDrink: number;
  cbxFruityDrink: boolean;
  cbxDessertDrink: boolean;
  // UI preferences
  expandableLayoutOpen: boolean;
  requestJson: boolean;
  reduceAnimations: boolean;
  updated: Date;
}

// Food Preferences
export interface FoodPreference {
  id: string;
  userId: string;
  name: string;
  isLiked: boolean;
  created: Date;
}

// API & Logging
export interface ApiLog {
  id: string;
  userId: string;
  prompt: string;
  response: string;
  focusPhrase?: string;
  apiProvider: 'openai' | 'deepseek' | 'grok';
  executionTime: number;
  type: 'food' | 'cocktail';
  created: Date;
}

// Premium & Subscriptions
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: 'EUR' | 'USD';
  features: string[];
  maxRecipesPerDay: number;
  maxRecipesPerMonth: number;
}

export interface PaymentMethod {
  id: string;
  type: 'paypal' | 'stripe';
  isDefault: boolean;
}

// Referral System
export interface Referral {
  id: string;
  referrerUserId: string;
  referralCode: string;
  referredUserId?: string;
  created: Date;
  used?: Date;
}

// Shared Recipes
export interface SharedRecipe {
  id: string;
  recipeId: string;
  shareCode: string;
  viewCount: number;
  created: Date;
}

// Form Types
export interface RecipeGenerationForm {
  type: 'food' | 'cocktail';
  dietType: string;
  goal?: string;
  region?: string;
  additionalWishes?: string;
  diversity: number;
  duration: number;
  cost: number;
  servings: number;
  api: 'openai' | 'deepseek' | 'grok';
}

// Recipe Generation Request
export interface RecipeRequest {
  ingredients: string[];
  servings: number;
  cookingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  preferences?: string[];
  additionalRequests?: string;
  aiProvider: 'openai' | 'deepseek' | 'grok';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// PWA Types
export interface InstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Language Types
export type Language = 'de' | 'en';

// Filter and Sort Types
export interface RecipeFilters {
  search?: string;
  dietType?: string;
  cookingTime?: number;
  servings?: number;
  isFavorite?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface SortOption {
  field: 'created' | 'title' | 'preparationTime' | 'servings';
  direction: 'asc' | 'desc';
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}