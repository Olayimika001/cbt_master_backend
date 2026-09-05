import { Router } from 'express';
import { login, register, forgotPassword, logout } from './controller.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/logout', logout);

export default router;
export { router as authRouter };
