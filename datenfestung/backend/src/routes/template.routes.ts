import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { TemplateController } from '@/controllers/template.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { validateRequest } from '@/middleware/validation.middleware';

const router = Router();
const templateController = new TemplateController();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation rules
const createTemplateValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Template name must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .isIn(['data_processing', 'security_assessment', 'compliance_check', 'incident_response', 'training', 'audit'])
    .withMessage('Invalid template category'),
  body('industry')
    .isIn(['healthcare', 'finance', 'ecommerce', 'manufacturing', 'education', 'government', 'technology', 'generic'])
    .withMessage('Invalid industry'),
  body('isPublic')
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('processSteps')
    .isArray({ min: 1 })
    .withMessage('At least one process step is required'),
  body('processSteps.*.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Process step name must be between 2 and 100 characters'),
  body('processSteps.*.order')
    .isInt({ min: 1 })
    .withMessage('Process step order must be a positive integer'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
];

const updateTemplateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Template name must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('category')
    .optional()
    .isIn(['data_processing', 'security_assessment', 'compliance_check', 'incident_response', 'training', 'audit'])
    .withMessage('Invalid template category'),
  body('industry')
    .optional()
    .isIn(['healthcare', 'finance', 'ecommerce', 'manufacturing', 'education', 'government', 'technology', 'generic'])
    .withMessage('Invalid industry'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
];

const templateIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Template ID must be a positive integer'),
];

const applyTemplateValidation = [
  body('processName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Process name must be between 3 and 200 characters'),
  body('customData')
    .optional()
    .isObject()
    .withMessage('Custom data must be an object'),
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),
];

// Routes

// @route   GET /api/templates
// @desc    Get all templates with filtering and pagination
// @access  Private
router.get(
  '/',
  queryValidation,
  validateRequest,
  templateController.getTemplates
);

// @route   GET /api/templates/statistics
// @desc    Get template statistics
// @access  Private
router.get(
  '/statistics',
  templateController.getTemplateStatistics
);

// @route   GET /api/templates/:id
// @desc    Get template by ID
// @access  Private
router.get(
  '/:id',
  templateIdValidation,
  validateRequest,
  templateController.getTemplateById
);

// @route   POST /api/templates
// @desc    Create new template
// @access  Private
router.post(
  '/',
  createTemplateValidation,
  validateRequest,
  templateController.createTemplate
);

// @route   PUT /api/templates/:id
// @desc    Update template
// @access  Private
router.put(
  '/:id',
  templateIdValidation,
  updateTemplateValidation,
  validateRequest,
  templateController.updateTemplate
);

// @route   DELETE /api/templates/:id
// @desc    Delete template
// @access  Private
router.delete(
  '/:id',
  templateIdValidation,
  validateRequest,
  templateController.deleteTemplate
);

// @route   POST /api/templates/:id/clone
// @desc    Clone template
// @access  Private
router.post(
  '/:id/clone',
  templateIdValidation,
  validateRequest,
  templateController.cloneTemplate
);

// @route   POST /api/templates/:id/apply
// @desc    Apply template to create new process
// @access  Private
router.post(
  '/:id/apply',
  templateIdValidation,
  applyTemplateValidation,
  validateRequest,
  templateController.applyTemplate
);

export default router;