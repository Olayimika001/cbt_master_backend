import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getBookmarks, addBookmark, removeBookmark } from './controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', getBookmarks);
router.post('/', addBookmark);
router.delete('/:questionId', removeBookmark);

export default router;
export { router as bookmarksRouter };
