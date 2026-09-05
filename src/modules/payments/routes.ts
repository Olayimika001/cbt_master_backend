import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { initializePayment, verifyPayment } from './controller.js';

const router = Router();

router.use(requireAuth);

router.post('/initialize', initializePayment);
router.post('/verify', verifyPayment);

export default router;
export { router as paymentsRouter };
