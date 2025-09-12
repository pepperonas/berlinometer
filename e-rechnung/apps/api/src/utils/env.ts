import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.string().default('3001'),
  API_HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api/v1'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  
  // CORS
  CORS_ORIGIN: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_MAX: z.string().default('1000'),
  RATE_LIMIT_WINDOW: z.string().default('15 minutes'),
  
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // MinIO / S3
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_PORT: z.coerce.number().optional(),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_USE_SSL: z.string().transform(val => val === 'true').default('false'),
  MINIO_BUCKET: z.string().default('handwerkos'),
  
  // Email (SMTP)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.string().transform(val => val === 'true').default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  
  // Features
  ENABLE_REGISTRATION: z.string().transform(val => val === 'true').default('true'),
  ENABLE_EMAIL_VERIFICATION: z.string().transform(val => val === 'true').default('false'),
  ENABLE_2FA: z.string().transform(val => val === 'true').default('false'),
  ENABLE_INVOICE_EMAIL: z.string().transform(val => val === 'true').default('true'),
  ENABLE_XRECHNUNG_EXPORT: z.string().transform(val => val === 'true').default('true'),
})