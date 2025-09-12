import { z } from 'zod'

// Registration schema
export const registerSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and numbers'),
  confirmPassword: z.string(),
  
  // Company Information
  companyName: z.string().min(2, 'Company name is required'),
  tenantSlug: z.string()
    .min(3, 'Tenant slug must be at least 3 characters')
    .max(30, 'Tenant slug cannot exceed 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens allowed'),
  industry: z.enum(['HANDWERK', 'GASTRO', 'EINZELHANDEL', 'DIENSTLEISTUNG', 'BERATUNG', 'IT', 'GESUNDHEIT', 'OTHER']),
  
  // Address
  street: z.string().min(3, 'Street address is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
  city: z.string().min(2, 'City is required'),
  
  // Optional fields
  legalForm: z.string().optional(),
  taxId: z.string().optional(),
  vatId: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  
  // Legal
  acceptTerms: z.boolean().refine(val => val, 'You must accept the terms and conditions'),
  acceptPrivacy: z.boolean().refine(val => val, 'You must accept the privacy policy'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type RegisterRequest = z.infer<typeof registerSchema>

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
  twoFactorCode: z.string().optional(),
})

export type LoginRequest = z.infer<typeof loginSchema>

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
})

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and numbers'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and numbers'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>

// Update profile schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.string().optional(),
})

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>

// Two-factor authentication schemas
export const setupTwoFactorSchema = z.object({
  secret: z.string().min(1, 'Secret is required'),
  code: z.string().length(6, 'Code must be 6 digits'),
})

export type SetupTwoFactorRequest = z.infer<typeof setupTwoFactorSchema>

export const verifyTwoFactorSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
})

export type VerifyTwoFactorRequest = z.infer<typeof verifyTwoFactorSchema>

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  code: z.string().length(6, 'Code must be 6 digits'),
})

export type DisableTwoFactorRequest = z.infer<typeof disableTwoFactorSchema>