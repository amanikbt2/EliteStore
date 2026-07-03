import { Router } from 'express';
import { loginAdmin, logoutAdmin } from '../controllers/auth.controller';

const router = Router();

router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);

export default router;
