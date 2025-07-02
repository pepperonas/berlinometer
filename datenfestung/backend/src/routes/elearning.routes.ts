import { Router } from 'express';
import { Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth.middleware';

const router = Router();

router.get('/courses', async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch courses',
      },
    });
  }
});

export default router;