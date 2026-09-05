import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getQuestions } from './controller.js';

const router = Router({ mergeParams: true });

// GET /courses/:courseId/questions
router.get('/:courseId/questions', requireAuth, getQuestions);

export default router;
export { router as questionsRouter };
