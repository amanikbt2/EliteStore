import { Router } from 'express';
import { getTheme, updateTheme } from '../controllers/settings.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/theme', getTheme);
router.patch('/theme', requireAdmin, updateTheme);

export default router;
