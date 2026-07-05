import { Router } from 'express';
import { getApps, getAppByPackageName, checkUpdate, createApp, releaseUpdate, deleteApp, incrementDownloads, toggleDownload } from '../controllers/app.controller';
import { getReviews, createReview } from '../controllers/review.controller';

const router = Router();

router.get('/', getApps);
router.post('/', createApp);
router.get('/:packageName', getAppByPackageName);
router.post('/:packageName/update', releaseUpdate);
router.delete('/:packageName', deleteApp);
router.post('/:packageName/download', incrementDownloads);
router.patch('/:packageName/toggle-download', toggleDownload);

// Review routes
router.get('/:packageName/reviews', getReviews);
router.post('/:packageName/reviews', createReview);

export default router;
