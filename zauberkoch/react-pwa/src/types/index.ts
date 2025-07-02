// Optimized TypeScript interfaces for Zauberkoch React PWA

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  active: boolean;
  admin: boolean;
  verified: boolean;
  birthDate?: string; // ISO date string
  gender?: 'male' | 'female' | 'other';
  weight?: number;
  nationality?: number;
  created: string; // ISO date string
  lastSeen: string; // ISO date string
  premiumExpiration?: string; // ISO date string
  subscriptionId?: string;
  execCount: number;
  referralsCount: number;
  googleOauth: boolean;
  theme?: 'light' | 'dark';
}

export interface Recipe {
  id: number;
  userId: number;
  apiLogId?: number;
  title: string;
  preparationTime: string;
  cost: string;
  alcoholContent?: string;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string;
  tips?: string;
  importantNotes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  favorite: boolean;
}

export interface RecipeIngredient {
  id?: number;
  recipeId?: number;
  name: string;
  quantity: string;
  unit: string;
}

export interface UserSettings {
  id?: number;
  userId: number;
  updated: string; // ISO date string
  
  // Recipe generation preferences
  rgType: RecipeType;
  rgGoal: string;
  rgApi: AIProvider;
  
  // Drink preferences (for cocktails)
  rgTypeDrink?: DrinkType;
  rgStyleDrink?: DrinkStyle;
  
  // Sliders (0-100 values)
  sliderDiversity: number;
  sliderDuration: number;
  sliderCost: number;
  sliderPortions: number;
  sliderComplexity: number;
  sliderAlcoholContent?: number;
  
  // Health/lifestyle checkboxes
  cbxThin: boolean;
  cbxHeavy: boolean;
  cbxMuscles: boolean;
  cbxHealthy: boolean;
  
  // Drink type checkboxes
  cbxFruity?: boolean;
  cbxDessert?: boolean;
  
  // UI preferences
  expandableLayoutOpen: boolean;
  requestJson: boolean;
  reduceAnimations: boolean;
  theme: 'light' | 'dark';
}

export interface FoodPreference {
  id: number;
  userId: number;
  name: string;
  liked: boolean;
}

export interface ApiLog {
  id: number;
  userId: number;
  prompt: string;
  response: string;
  created: string; // ISO date string
  starred: boolean;
  focusPhrase?: string;
  recUuid: string;
  api: AIProvider;
  executionTime: number;
}

export interface ReferralCode {
  id: number;
  referralCode: string;
  userId: number;
  usageCount: number;
  createdAt: string; // ISO date string
}

// Enums and union types
export type RecipeType = 
  | 'Ich esse alles'
  | 'Vegetarisch'
  | 'Vegan'
  | 'Glutenfrei'
  | 'Laktosefrei'
  | 'Keto'
  | 'Low-Carb'
  | 'High-Protein';

export type DrinkType = 'Alkoholisch' | 'Alkoholfrei';

export type DrinkStyle = 
  | 'Klassisch'
  | 'Modern'
  | 'Tropical'
  | 'Cremig'
  | 'Bitter'
  | 'Süß'
  | 'Sauer';

export type AIProvider = 'chat_gpt' | 'deepseek' | 'grok';

export type MealType = 
  | 'Frühstück'
  | 'Mittagessen'
  | 'Abendessen'
  | 'Snack'
  | 'Dessert';

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RecipeGenerationRequest {
  mealType: MealType;
  preferences: UserSettings;
  foodPreferences: FoodPreference[];
  customPrompt?: string;
}

export interface RecipeGenerationResponse {
  recipe: Recipe;
  apiLogId: number;
  executionTime: number;
}

// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

// UI State management types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  theme: 'light' | 'dark';
}

export interface RecipeState {
  recipes: Recipe[];
  favoriteRecipes: Recipe[];
  currentRecipe: Recipe | null;
  loading: boolean;
  error: string | null;
}

export interface SettingsState {
  settings: UserSettings | null;
  foodPreferences: FoodPreference[];
  loading: boolean;
  error: string | null;
}

// Component prop types
export interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
}

export interface RecipeCardProps {
  recipe: Recipe;
  onToggleFavorite: (recipeId: number) => void;
  onShare: (recipe: Recipe) => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipeId: number) => void;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  values: T;
  errors: ValidationError[];
  touched: { [K in keyof T]?: boolean };
  isValid: boolean;
  isSubmitting: boolean;
}

// PWA specific types
export interface InstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface ServiceWorkerRegistration {
  installing: ServiceWorker | null;
  waiting: ServiceWorker | null;
  active: ServiceWorker | null;
  addEventListener(type: string, listener: EventListener): void;
  update(): Promise<void>;
  unregister(): Promise<boolean>;
}