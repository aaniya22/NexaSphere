import { Router } from 'express';
import { syncController } from '../controllers/syncController.js';
import { requireStudentAuth } from '../middleware/studentAuthMiddleware.js';

const router = Router();

router.get('/api/sync/status', syncController.getSyncStatus);
router.get('/api/sync/updates', syncController.getUpdates);
router.post('/api/sync/batch', requireStudentAuth, syncController.syncBatch);

export default router;
