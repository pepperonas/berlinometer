import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '@/controllers/auth.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { validateRequest } from '@/middleware/validation.middleware';

const router = Router();
const authController = new AuthController();

// Validation rules
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('organizationId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Organization ID must be a positive integer'),
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number'),
];

const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('currentPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Current password is required for password change'),
  body('newPassword')
    .optional()
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number'),
];

// Public routes
router.post('/login', loginValidation, validateRequest, authController.login);

router.post('/register', registerValidation, validateRequest, authController.register);

router.post('/forgot-password', forgotPasswordValidation, validateRequest, authController.forgotPassword);

router.post('/reset-password', resetPasswordValidation, validateRequest, authController.resetPassword);

router.post('/refresh', authController.refreshToken);

// Protected routes
router.use(authenticateToken);

router.post('/logout', authController.logout);

router.get('/me', authController.getCurrentUser);

router.put('/profile', updateProfileValidation, validateRequest, authController.updateProfile);

export default router;