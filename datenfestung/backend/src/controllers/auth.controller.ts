import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';
import { EmailService } from '@/services/email.service';

const prisma = new PrismaClient();
const emailService = new EmailService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Return user data and tokens
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
            organization: user.organization,
          },
          token: accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during login',
        },
      });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, organizationId } = req.body;

      // Check if registration is enabled
      if (process.env.ENABLE_REGISTRATION !== 'true') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'REGISTRATION_DISABLED',
            message: 'Registration is currently disabled',
          },
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
          },
        });
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          organizationId,
          role: 'user', // Default role
          isActive: true,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      // Send welcome email
      try {
        await emailService.sendWelcomeEmail(user.email, user.firstName);
      } catch (emailError) {
        console.error('Welcome email error:', emailError);
        // Don't fail registration if email fails
      }

      // Return user data and tokens
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
            organization: user.organization,
          },
          token: accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during registration',
        },
      });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      // In a production app, you might want to blacklist the token
      // or store refresh tokens in a database to invalidate them
      
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during logout',
        },
      });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_REQUIRED',
            message: 'Refresh token is required',
          },
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      // Get user
      const user = await prisma.user.findUnique({
        where: { 
          id: decoded.userId,
          isActive: true,
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid refresh token',
          },
        });
      }

      // Generate new tokens
      const newAccessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );

      const newRefreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
            organization: user.organization,
          },
          token: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_EXPIRED',
            message: 'Refresh token has expired',
          },
        });
      }

      console.error('Refresh token error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while refreshing token',
        },
      });
    }
  }

  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
          organization: user.organization,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching user data',
        },
      });
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { firstName, lastName, email, currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      const updateData: any = {};

      // Update basic information
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;

      // Handle password change
      if (newPassword && currentPassword) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
            },
          });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_CURRENT_PASSWORD',
              message: 'Current password is incorrect',
            },
          });
        }

        // Hash new password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
        updateData.passwordHash = await bcrypt.hash(newPassword, saltRounds);
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          organizationId: updatedUser.organizationId,
          organization: updatedUser.organization,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating profile',
        },
      });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      // Send reset email
      try {
        await emailService.sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        console.error('Password reset email error:', emailError);
        // Don't expose email sending errors to the client
      }

      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while processing password reset request',
        },
      });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      // Verify reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update user password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { passwordHash },
      });

      res.json({
        success: true,
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Reset token has expired',
          },
        });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid reset token',
          },
        });
      }

      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while resetting password',
        },
      });
    }
  }
}