import { Router } from 'express';
import { createLog, getLogs, clearLogs } from '../controllers/log.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/', createLog);
router.get('/', requireAdmin, getLogs);
router.delete('/', requireAdmin, clearLogs);

export default router;
