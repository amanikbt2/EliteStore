import { Router } from 'express';
import { getApps, getAppByPackageName, checkUpdate, createApp, releaseUpdate, deleteApp, incrementDownloads, toggleDownload, downloadApkFile, updateVirtualMetrics } from '../controllers/app.controller';
import { getReviews, createReview } from '../controllers/review.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getApps);
router.post('/', requireAdmin, createApp);
router.get('/:packageName', getAppByPackageName);
router.post('/:packageName/update', requireAdmin, releaseUpdate);
router.delete('/:packageName', requireAdmin, deleteApp);
router.post('/:packageName/download', incrementDownloads);
router.get('/:packageName/download-file', downloadApkFile);
router.patch('/:packageName/toggle-download', requireAdmin, toggleDownload);
router.patch('/:packageName/virtual-metrics', requireAdmin, updateVirtualMetrics);

// Review routes
router.get('/:packageName/reviews', getReviews);
router.post('/:packageName/reviews', createReview);

export default router;
