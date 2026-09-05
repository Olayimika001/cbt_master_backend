import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  getNotifications,
  getNotificationById,
  markNotificationRead,
} from './controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.get('/:id', getNotificationById);
router.patch('/:id/read', markNotificationRead);

export default router;
export { router as notificationsRouter };
