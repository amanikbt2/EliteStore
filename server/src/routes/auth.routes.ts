import { Router } from 'express';
import { loginAdmin, logoutAdmin } from '../controllers/auth.controller';
import { getDashboardStats } from '../controllers/admin.controller';

const router = Router();

router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
router.get('/stats', getDashboardStats);

export default router;
