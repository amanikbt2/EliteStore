import { Router } from 'express';
import { getApps, getAppByPackageName, checkUpdate, createApp, releaseUpdate, deleteApp, incrementDownloads } from '../controllers/app.controller';
import { getReviews, createReview } from '../controllers/review.controller';

const router = Router();

router.get('/', getApps);
router.post('/', createApp);
router.get('/:packageName', getAppByPackageName);
router.post('/:packageName/update', releaseUpdate);
router.delete('/:packageName', deleteApp);
router.post('/:packageName/download', incrementDownloads);

// Review routes
router.get('/:packageName/reviews', getReviews);
router.post('/:packageName/reviews', createReview);

export default router;
