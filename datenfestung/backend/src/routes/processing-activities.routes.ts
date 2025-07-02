import { Router } from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';

const router = Router();

// Mock processing activities data
const mockActivities = [
  {
    id: 1,
    organizationId: 1,
    name: 'Kundendatenverarbeitung',
    purpose: 'Vertragsabwicklung und Kundenbetreuung',
    legalBasis: 'contract',
    dataCategories: ['Stammdaten', 'Kontaktdaten', 'Vertragsdaten'],
    dataSubjects: ['Kunden'],
    recipients: ['Interne Mitarbeiter', 'IT-Dienstleister'],
    thirdCountryTransfers: false,
    retentionPeriod: '10 Jahre nach Vertragsende',
    isJointProcessing: false,
    tomIds: [1, 2, 3],
    status: 'active',
    createdBy: 1,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
];

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        activities: mockActivities,
        totalCount: mockActivities.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch processing activities',
      },
    });
  }
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newActivity = {
      id: Date.now(),
      organizationId: req.user!.organizationId || 1,
      ...req.body,
      createdBy: req.user!.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      data: newActivity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create processing activity',
      },
    });
  }
});

export default router;