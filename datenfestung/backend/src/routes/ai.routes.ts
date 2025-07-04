import { Router } from 'express';
import { body } from 'express-validator';
import { AIController } from '@/controllers/ai.controller';
import { authenticateToken } from '@/middleware/auth.middleware';
import { validateRequest } from '@/middleware/validation.middleware';

const router = Router();
const aiController = new AIController();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation rules
const riskAnalysisValidation = [
  body('processDescription')
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Process description must be between 20 and 5000 characters'),
  body('dataTypes')
    .isArray({ min: 1 })
    .withMessage('At least one data type must be specified'),
  body('dataSubjects')
    .isArray({ min: 1 })
    .withMessage('At least one data subject category must be specified'),
  body('thirdPartySharing')
    .isBoolean()
    .withMessage('Third party sharing must be a boolean'),
  body('industry')
    .isIn(['healthcare', 'finance', 'ecommerce', 'manufacturing', 'education', 'government', 'technology', 'generic'])
    .withMessage('Invalid industry'),
  body('organizationSize')
    .isIn(['small', 'medium', 'large', 'enterprise'])
    .withMessage('Invalid organization size'),
  body('geographicScope')
    .isIn(['local', 'national', 'european', 'global'])
    .withMessage('Invalid geographic scope'),
  body('technicalMeasures')
    .optional()
    .isArray()
    .withMessage('Technical measures must be an array'),
  body('organizationalMeasures')
    .optional()
    .isArray()
    .withMessage('Organizational measures must be an array'),
  body('existingControls')
    .optional()
    .isArray()
    .withMessage('Existing controls must be an array'),
];

const recommendationsValidation = [
  body('riskFactors')
    .isObject()
    .withMessage('Risk factors must be an object'),
  body('industry')
    .isIn(['healthcare', 'finance', 'ecommerce', 'manufacturing', 'education', 'government', 'technology', 'generic'])
    .withMessage('Invalid industry'),
  body('organizationSize')
    .isIn(['small', 'medium', 'large', 'enterprise'])
    .withMessage('Invalid organization size'),
  body('existingControls')
    .optional()
    .isArray()
    .withMessage('Existing controls must be an array'),
];

const chatValidation = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  body('sessionId')
    .optional()
    .isString()
    .withMessage('Session ID must be a string'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object'),
];

const complianceGapsValidation = [
  body('frameworks')
    .isArray({ min: 1 })
    .withMessage('At least one framework must be specified'),
  body('frameworks.*')
    .isIn(['GDPR', 'ISO27001', 'NIST', 'SOX', 'HIPAA', 'PCI-DSS'])
    .withMessage('Invalid framework'),
  body('currentImplementation')
    .isObject()
    .withMessage('Current implementation must be an object'),
  body('organizationProfile')
    .isObject()
    .withMessage('Organization profile must be an object'),
];

const documentationValidation = [
  body('documentType')
    .isIn(['DPIA', 'risk_assessment', 'privacy_policy', 'incident_response', 'training_material'])
    .withMessage('Invalid document type'),
  body('processData')
    .isObject()
    .withMessage('Process data must be an object'),
  body('processData.name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Process name must be between 3 and 200 characters'),
  body('template')
    .optional()
    .isString()
    .withMessage('Template must be a string'),
];

// Routes

// @route   POST /api/ai/analyze-risk
// @desc    Perform AI-powered risk analysis
// @access  Private
router.post(
  '/analyze-risk',
  riskAnalysisValidation,
  validateRequest,
  aiController.analyzeRisk
);

// @route   POST /api/ai/recommendations
// @desc    Get AI recommendations for specific risks
// @access  Private
router.post(
  '/recommendations',
  recommendationsValidation,
  validateRequest,
  aiController.getRecommendations
);

// @route   POST /api/ai/chat
// @desc    Chat with AI assistant
// @access  Private
router.post(
  '/chat',
  chatValidation,
  validateRequest,
  aiController.chat
);

// @route   POST /api/ai/compliance-gaps
// @desc    Analyze compliance gaps using AI
// @access  Private
router.post(
  '/compliance-gaps',
  complianceGapsValidation,
  validateRequest,
  aiController.analyzeComplianceGaps
);

// @route   POST /api/ai/generate-documentation
// @desc    Generate automated documentation using AI
// @access  Private
router.post(
  '/generate-documentation',
  documentationValidation,
  validateRequest,
  aiController.generateDocumentation
);

export default router;