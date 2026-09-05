import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import {
  getCourses,
  searchCourses,
  filterCourses,
  getCourseById,
  checkCourseAccess,
  createCourse,
  updateCourse,
  deleteCourse,
} from './controller.js';
import { getQuestions } from '../questions/controller.js';
import { startAttempt } from '../attempts/controller.js';

const router = Router();

// Public Read Endpoints
router.get('/', getCourses);
router.get('/search', searchCourses);
router.get('/filter', filterCourses);
router.get('/:courseId', getCourseById);

// Protected Course Access Endpoint: GET /courses/:courseId/access
router.get('/:courseId/access', requireAuth, checkCourseAccess);

// Protected Questions Endpoint: GET /courses/:courseId/questions
router.get('/:courseId/questions', requireAuth, getQuestions);

// Protected Attempts Endpoint: POST /courses/:courseId/attempts
router.post('/:courseId/attempts', requireAuth, startAttempt);

// Admin-Only Write Endpoints
router.post('/', requireAuth, requireRole('admin'), createCourse);
router.patch('/:courseId', requireAuth, requireRole('admin'), updateCourse);
router.delete('/:courseId', requireAuth, requireRole('admin'), deleteCourse);

export default router;
export { router as coursesRouter };

