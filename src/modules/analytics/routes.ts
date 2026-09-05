import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getAnalytics, getLeaderboard } from './controller.js';

const router = Router();

router.get('/analytics', requireAuth, getAnalytics);
router.get('/leaderboard', requireAuth, getLeaderboard);

export default router;
export { router as analyticsRouter };
