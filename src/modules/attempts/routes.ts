import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  getQuestions,
  startAttempt,
  getAttemptDetails,
  saveAnswer,
  pauseAttempt,
  resumeAttempt,
  submitAttempt,
  getAttemptResult,
  getSessionReview,
  getAttemptHistory,
} from './controller.js';

const router = Router();

// Questions route (publicly accessible)
router.get('/questions', getQuestions);

// Protect all other /attempts and /cbt routes with requireAuth
router.use(requireAuth);

// Creation
router.post('/attempts', startAttempt);
router.post('/attempts/start', startAttempt);
router.post('/start', startAttempt);
router.post('/', startAttempt);

// History
router.get('/history', getAttemptHistory);
router.get('/attempts/history', getAttemptHistory);

// Attempt Specific operations
router.get('/attempts/:attemptId', getAttemptDetails);
router.get('/attempts/:attemptId/result', getAttemptResult);
router.get('/result/:attemptId', getAttemptResult);
router.post('/attempts/:attemptId/submit', submitAttempt);
router.post('/submit/:attemptId', submitAttempt);
router.patch('/attempts/:attemptId/pause', pauseAttempt);
router.post('/attempts/:attemptId/pause', pauseAttempt);
router.post('/attempts/:attemptId/resume', resumeAttempt);
router.patch('/attempts/:attemptId/answers/:questionId', saveAnswer);

// Direct /:attemptId aliases
router.get('/:attemptId', getAttemptDetails);
router.get('/:attemptId/result', getAttemptResult);
router.post('/:attemptId/submit', submitAttempt);
router.patch('/:attemptId/pause', pauseAttempt);
router.post('/:attemptId/pause', pauseAttempt);
router.post('/:attemptId/resume', resumeAttempt);
router.patch('/:attemptId/answers/:questionId', saveAnswer);

// Session Review
router.get('/sessions/:sessionId/review', getSessionReview);
router.get('/attempts/:attemptId/review', getSessionReview);
router.get('/:attemptId/review', getSessionReview);
router.get('/review/:attemptId', getSessionReview);


export default router;
export { router as attemptsRouter, router as cbtRouter };

