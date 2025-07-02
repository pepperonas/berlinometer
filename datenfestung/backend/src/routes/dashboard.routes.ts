import { Router } from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';

const router = Router();

// Mock dashboard data
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = {
      totalProcessingActivities: 24,
      activeTasks: 8,
      overdueTasks: 2,
      expiringContracts: 3,
      completedTrainings: 15,
      totalUsers: 12,
      complianceScore: 92,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch dashboard stats',
      },
    });
  }
});

router.get('/notifications', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = [
      {
        id: 1,
        type: 'contract_expiry',
        title: 'Vertrag läuft ab',
        message: 'Der Cloud-Hosting Vertrag läuft in 30 Tagen ab',
        priority: 'high',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch notifications',
      },
    });
  }
});

export default router;