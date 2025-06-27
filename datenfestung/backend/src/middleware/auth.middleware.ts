import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    organizationId?: number;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required',
        },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || undefined,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication error',
      },
    });
  }
};

export const requireRole = (roles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};

export const requireSameOrganization = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { organizationId } = req.params;
    const userOrgId = req.user?.organizationId;

    // Admins can access any organization
    if (req.user?.role === 'admin') {
      return next();
    }

    // Check if user belongs to the same organization
    if (!userOrgId || userOrgId.toString() !== organizationId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied to this organization',
        },
      });
    }

    next();
  } catch (error) {
    console.error('Organization check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authorization error',
      },
    });
  }
};