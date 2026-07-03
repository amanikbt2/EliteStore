import { Router } from 'express';
import { getApps, getAppByPackageName, checkUpdate, createApp, releaseUpdate } from '../controllers/app.controller';

const router = Router();

router.get('/', getApps);
router.post('/', createApp);
router.get('/:packageName', getAppByPackageName);
router.post('/:packageName/update', releaseUpdate);

export default router;
