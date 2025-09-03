// App Configuration
export const APP_CONFIG = {
  name: 'ZauberKoch',
  version: '2.0.0',
  description: 'AI-powered Recipe Generator',
  author: 'Martin',
  defaultLanguage: 'de' as const,
  supportedLanguages: ['de', 'en'] as const,
};

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.zauberkoch.com' 
    : 'http://localhost:4000',
  timeout: 30000,
  retryAttempts: 3,
  rateLimits: {
    free: {
      recipesPerDay: 3,
      recipesPerHour: 3,
      requestsPerMinute: 10,
    },
    premium: {
      recipesPerDay: 50,
      recipesPerHour: 10,
      requestsPerMinute: 30,
    },
  },
};

// AI Provider Configuration
export const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI GPT-4o',
    model: 'gpt-4o',
    maxTokens: 1500,
    temperature: 0.7,
    systemPrompt: 'You are a professional chef assistant. Create detailed, delicious recipes.',
  },
  deepseek: {
    name: 'DeepSeek',
    model: 'deepseek-chat',
    maxTokens: 1500,
    temperature: 0.7,
    systemPrompt: 'You are a culinary expert. Generate creative and practical recipes.',
  },
  grok: {
    name: 'Grok AI',
    model: 'grok-2-latest',
    maxTokens: 1500,
    temperature: 0.7,
    systemPrompt: 'You are Grok, an AI chef inspired by the Hitchhiker\'s Guide to the Galaxy. Create witty and delicious recipes.',
  },
} as const;

// Difficulty Levels
export const DIFFICULTY_LEVELS = [
  { id: 'easy', name: 'Einfach', description: 'Schnell und einfach zuzubereiten' },
  { id: 'medium', name: 'Mittel', description: 'Mittlerer Aufwand erforderlich' },
  { id: 'hard', name: 'Schwer', description: 'Fortgeschrittene Kochkenntnisse erforderlich' },
] as const;

// Cooking Times
export const COOKING_TIMES = [
  { id: '15', name: '15 Minuten', minutes: 15 },
  { id: '30', name: '30 Minuten', minutes: 30 },
  { id: '45', name: '45 Minuten', minutes: 45 },
  { id: '60', name: '1 Stunde', minutes: 60 },
  { id: '90', name: '1.5 Stunden', minutes: 90 },
  { id: '120', name: '2 Stunden', minutes: 120 },
  { id: '180', name: '3+ Stunden', minutes: 180 },
] as const;

// AI Providers as Array (for UI components)
export const AI_PROVIDERS_ARRAY = [
  { id: 'openai', ...AI_PROVIDERS.openai },
  { id: 'deepseek', ...AI_PROVIDERS.deepseek },
  { id: 'grok', ...AI_PROVIDERS.grok },
] as const;

// Recipe Categories & Options
export const RECIPE_OPTIONS = {
  dietTypes: {
    food: [
      { value: 'all', labelKey: 'diet.all' },
      { value: 'vegetarian', labelKey: 'diet.vegetarian' },
      { value: 'vegan', labelKey: 'diet.vegan' },
      { value: 'pescatarian', labelKey: 'diet.pescatarian' },
      { value: 'keto', labelKey: 'diet.keto' },
      { value: 'paleo', labelKey: 'diet.paleo' },
      { value: 'gluten_free', labelKey: 'diet.gluten_free' },
      { value: 'dairy_free', labelKey: 'diet.dairy_free' },
    ],
    drink: [
      { value: 'all', labelKey: 'drink.all' },
      { value: 'alcoholic', labelKey: 'drink.alcoholic' },
      { value: 'non_alcoholic', labelKey: 'drink.non_alcoholic' },
      { value: 'low_alcohol', labelKey: 'drink.low_alcohol' },
    ],
  },
  goals: [
    { value: 'healthy', labelKey: 'goal.healthy' },
    { value: 'muscle', labelKey: 'goal.muscle' },
    { value: 'weight_loss', labelKey: 'goal.weight_loss' },
    { value: 'comfort', labelKey: 'goal.comfort' },
    { value: 'quick', labelKey: 'goal.quick' },
  ],
  regions: [
    { value: 'international', labelKey: 'region.international' },
    { value: 'italian', labelKey: 'region.italian' },
    { value: 'asian', labelKey: 'region.asian' },
    { value: 'german', labelKey: 'region.german' },
    { value: 'french', labelKey: 'region.french' },
    { value: 'mexican', labelKey: 'region.mexican' },
    { value: 'indian', labelKey: 'region.indian' },
    { value: 'mediterranean', labelKey: 'region.mediterranean' },
  ],
  drinkStyles: [
    { value: 'classic', labelKey: 'drinkStyle.classic' },
    { value: 'modern', labelKey: 'drinkStyle.modern' },
    { value: 'exotic', labelKey: 'drinkStyle.exotic' },
    { value: 'simple', labelKey: 'drinkStyle.simple' },
  ],
};

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'EUR',
    features: [
      '3 recipes per day',
      'Basic AI providers',
      'Recipe history',
      'Favorites',
    ],
    maxRecipesPerDay: 3,
    maxRecipesPerMonth: 90,
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 4.99,
    currency: 'EUR',
    features: [
      'Unlimited recipes',
      'All AI providers',
      'Custom recipe requests',
      'Priority support',
      'No ads',
      'Recipe sharing',
      'Advanced filters',
    ],
    maxRecipesPerDay: 50,
    maxRecipesPerMonth: 1500,
    paypalPlanId: process.env.PAYPAL_SUBSCRIPTION_PLAN_ID || 'P-3FC35295DJ6051820M7FDZBQ',
    stripePriceId: process.env.STRIPE_PRICE_ID || 'price_1234567890abcdef',
  },
} as const;

// PayPal Configuration
export const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID || '',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.paypal.com' 
    : 'https://api.sandbox.paypal.com',
};

// Stripe Configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
};

// Google OAuth Configuration
export const GOOGLE_OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
};

// Database Configuration
export const DB_CONFIG = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/zauberkoch',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
};

// Email Configuration
export const EMAIL_CONFIG = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  from: process.env.EMAIL_FROM || 'noreply@zauberkoch.com',
  templates: {
    verification: 'verification',
    passwordReset: 'password-reset',
    welcome: 'welcome',
  },
};

// JWT Configuration
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiresIn: '1h',
  refreshExpiresIn: '7d',
  algorithm: 'HS256' as const,
};

// Security Configuration
export const SECURITY_CONFIG = {
  bcryptRounds: 12,
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  csrfSecret: process.env.CSRF_SECRET || 'your-csrf-secret-change-in-production',
};

// PWA Configuration
export const PWA_CONFIG = {
  name: 'ZauberKoch',
  shortName: 'ZauberKoch',
  description: 'AI-powered Recipe Generator - Discover delicious recipes with artificial intelligence',
  themeColor: '#E91E63',
  backgroundColor: '#ffffff',
  display: 'standalone' as const,
  orientation: 'portrait' as const,
  icons: [
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

// UI Configuration
export const UI_CONFIG = {
  theme: {
    colors: {
      primary: '#E91E63',
      secondary: '#FF9800',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3',
    },
    breakpoints: {
      xs: '320px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      xxl: '1400px',
    },
    animations: {
      duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      easing: {
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  pagination: {
    defaultPageSize: 12,
    pageSizeOptions: [6, 12, 24, 48],
  },
};

// Feature Flags
export const FEATURE_FLAGS = {
  enableGoogleAuth: true,
  enableStripe: process.env.NODE_ENV === 'production',
  enablePayPal: true,
  enableReferralSystem: true,
  enableRecipeSharing: true,
  enableOfflineMode: true,
  enablePushNotifications: false, // Not implemented yet
  enableAnalytics: process.env.NODE_ENV === 'production',
};

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  googleAnalytics: {
    trackingId: process.env.NEXT_PUBLIC_GA_TRACKING_ID || 'G-CFB9X06V8L',
  },
};

// Cache Configuration
export const CACHE_CONFIG = {
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: {
      session: 24 * 60 * 60, // 24 hours
      user: 30 * 60, // 30 minutes
      recipe: 60 * 60, // 1 hour
      rateLimit: 60, // 1 minute
    },
  },
  browser: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

export default {
  APP_CONFIG,
  API_CONFIG,
  AI_PROVIDERS,
  RECIPE_OPTIONS,
  SUBSCRIPTION_PLANS,
  PAYPAL_CONFIG,
  STRIPE_CONFIG,
  GOOGLE_OAUTH_CONFIG,
  DB_CONFIG,
  EMAIL_CONFIG,
  JWT_CONFIG,
  SECURITY_CONFIG,
  PWA_CONFIG,
  UI_CONFIG,
  FEATURE_FLAGS,
  ANALYTICS_CONFIG,
  CACHE_CONFIG,
};