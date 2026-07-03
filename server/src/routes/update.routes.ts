import { Router } from 'express';
import { checkUpdate } from '../controllers/app.controller';

const router = Router();

router.get('/:packageName', checkUpdate);

export default router;
