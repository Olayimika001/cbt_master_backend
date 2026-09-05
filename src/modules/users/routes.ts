import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  getMe,
  updateMe,
  changePassword,
  updateNotificationPreferences,
  deleteAccount,
} from './controller.js';

const router = Router();

// Protect all /users routes with requireAuth
router.use(requireAuth);

router.get('/me', getMe);
router.patch('/me', updateMe);

// Support root /profile paths
router.get('/', getMe);
router.patch('/', updateMe);
router.patch('/change-password', changePassword);
router.patch('/notification-preferences', updateNotificationPreferences);
router.delete('/', deleteAccount);

export default router;
export { router as usersRouter, router as profileRouter };
