import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { JWT_CONFIG, SECURITY_CONFIG } from './constants';
import type { User } from '@/types';

const secret = new TextEncoder().encode(JWT_CONFIG.secret);

// JWT Token Management
export async function createAccessToken(user: User): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    username: user.username,
    isPremium: isPremiumUser(user),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .setSubject(user.id)
    .sign(secret);
}

export async function createRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .setSubject(userId)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<{
  userId: string;
  email: string;
  username: string;
  isPremium: boolean;
} | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      username: payload.username as string,
      isPremium: payload.isPremium as boolean,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function verifyToken(token: string): Promise<{
  userId: string;
  email: string;
  username: string;
  isPremium: boolean;
} | null> {
  return verifyAccessToken(token);
}

// Password Management
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SECURITY_CONFIG.bcryptRounds);
}

export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// Cookie Configuration (for use in API routes)
export const AUTH_COOKIE_CONFIG = {
  accessToken: {
    name: 'access_token',
    maxAge: 60 * 60, // 1 hour
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  },
  refreshToken: {
    name: 'refresh_token', 
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  },
};

// Cookie Management
export function setAuthCookies(response: Response, accessToken: string, refreshToken: string): Response {
  const headers = new Headers(response.headers);
  
  // Set access token cookie
  headers.append('Set-Cookie', 
    `${AUTH_COOKIE_CONFIG.accessToken.name}=${accessToken}; ` +
    `Max-Age=${AUTH_COOKIE_CONFIG.accessToken.maxAge}; ` +
    `Path=${AUTH_COOKIE_CONFIG.accessToken.path}; ` +
    `${AUTH_COOKIE_CONFIG.accessToken.httpOnly ? 'HttpOnly; ' : ''}` +
    `${AUTH_COOKIE_CONFIG.accessToken.secure ? 'Secure; ' : ''}` +
    `SameSite=${AUTH_COOKIE_CONFIG.accessToken.sameSite}`
  );
  
  // Set refresh token cookie
  headers.append('Set-Cookie',
    `${AUTH_COOKIE_CONFIG.refreshToken.name}=${refreshToken}; ` +
    `Max-Age=${AUTH_COOKIE_CONFIG.refreshToken.maxAge}; ` +
    `Path=${AUTH_COOKIE_CONFIG.refreshToken.path}; ` +
    `${AUTH_COOKIE_CONFIG.refreshToken.httpOnly ? 'HttpOnly; ' : ''}` +
    `${AUTH_COOKIE_CONFIG.refreshToken.secure ? 'Secure; ' : ''}` +
    `SameSite=${AUTH_COOKIE_CONFIG.refreshToken.sameSite}`
  );
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// User Status Checks
export function isPremiumUser(user: User): boolean {
  if (!user.premiumExpiration) return false;
  return new Date(user.premiumExpiration) > new Date();
}

export function isAccountVerified(user: User): boolean {
  return user.verified;
}

// Session Management
export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export function createSession(
  user: User,
  accessToken: string,
  refreshToken: string
): AuthSession {
  return {
    user,
    accessToken,
    refreshToken,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  };
}

// Input Validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[!@#$%^&*])/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUsername(username: string): boolean {
  // Username: 3-20 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

// Rate Limiting & Security
export interface LoginAttempt {
  email: string;
  ip: string;
  timestamp: Date;
  success: boolean;
}

export class SecurityManager {
  private static loginAttempts = new Map<string, LoginAttempt[]>();
  
  static checkRateLimit(identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attempts = this.loginAttempts.get(identifier) || [];
    
    // Clean old attempts
    const recentAttempts = attempts.filter(
      attempt => now - attempt.timestamp.getTime() < windowMs
    );
    
    this.loginAttempts.set(identifier, recentAttempts);
    
    return recentAttempts.length < maxAttempts;
  }
  
  static recordAttempt(identifier: string, success: boolean, email: string, ip: string) {
    const attempts = this.loginAttempts.get(identifier) || [];
    attempts.push({
      email,
      ip,
      timestamp: new Date(),
      success,
    });
    
    this.loginAttempts.set(identifier, attempts);
  }
  
  static isBlocked(identifier: string): boolean {
    return !this.checkRateLimit(identifier);
  }
  
  static getRemainingAttempts(identifier: string, maxAttempts = 5): number {
    const attempts = this.loginAttempts.get(identifier) || [];
    const recentAttempts = attempts.filter(
      attempt => Date.now() - attempt.timestamp.getTime() < 15 * 60 * 1000
    );
    
    return Math.max(0, maxAttempts - recentAttempts.length);
  }
}

// Token Utilities
export function generateSecureToken(length = 32): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

export function generateReferralCode(): string {
  return generateSecureToken(8).toUpperCase();
}

// Google OAuth Utilities
export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  verified_email: boolean;
}

export async function verifyGoogleToken(token: string): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`);
    
    if (!response.ok) {
      throw new Error('Invalid Google token');
    }
    
    const userInfo = await response.json();
    return userInfo;
  } catch (error) {
    console.error('Google token verification failed:', error);
    return null;
  }
}

// User Limits & Premium Checks are in separate server-only file: ./user-limits.ts

// Middleware helper
export async function getAuthenticatedUser(request: Request): Promise<User | null> {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;
    
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const accessToken = cookies.access_token;
    if (!accessToken) return null;
    
    const payload = await verifyToken(accessToken);
    if (!payload) return null;
    
    // In a real app, you'd fetch the full user from database here
    // For now, returning a minimal user object
    return {
      id: payload.userId,
      email: payload.email,
      username: payload.username,
      firstName: '',
      lastName: '',
      language: 'de',
      premiumExpiration: null,
      subscriptionId: null,
      verified: true,
      googleOauth: false,
      referralCode: '',
      created: new Date(),
      lastSeen: new Date(),
    };
  } catch (error) {
    console.error('Authentication check failed:', error);
    return null;
  }
}

export default {
  createAccessToken,
  createRefreshToken,
  verifyToken,
  verifyAccessToken,
  hashPassword,
  comparePasswords,
  setAuthCookies,
  isPremiumUser,
  isAccountVerified,
  validateEmail,
  validatePassword,
  validateUsername,
  SecurityManager,
  generateSecureToken,
  generateReferralCode,
  verifyGoogleToken,
  getAuthenticatedUser,
};