/**
 * Form Submission Routes
 * Handles public form submissions for membership, recruitment,
 * and core team applications with rate limiting.
 */

import { Router } from 'express';
import * as formsController from '../controllers/formsController.js';
import { formRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/api/forms/membership', formRateLimiter, formsController.makeHandleForm('membership'));
router.post('/api/forms/recruitment', formRateLimiter, formsController.makeHandleForm('recruitment'));
router.post('/api/core-team/apply', formRateLimiter, formsController.makeHandleForm('core_team'));

router.post(
  '/api/submissions/membership',
  formRateLimiter,
  formsController.makeHandleForm('membership')
);
router.post(
  '/api/submissions/recruitment',
  formRateLimiter,
  formsController.makeHandleForm('recruitment')
);

export default router;
