import { Router } from 'express';
import authRoutes from './auth.routes';
import appRoutes from './app.routes';
import updateRoutes from './update.routes';
import uploadRoutes from './upload.routes';
import settingsRoutes from './settings.routes';
import logRoutes from './log.routes';

const router = Router();

router.use('/admin', authRoutes);
router.use('/apps', appRoutes);
router.use('/update', updateRoutes);
router.use('/upload', uploadRoutes);
router.use('/settings', settingsRoutes);
router.use('/logs', logRoutes);

export default router;
