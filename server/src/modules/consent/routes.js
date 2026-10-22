import { Router } from 'express';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { recordConsent } from './controller.js';
import { recordConsentSchema } from './schema.js';

const router = Router();

router.post('/', optionalAuth, validate(recordConsentSchema), recordConsent);

export default router;
