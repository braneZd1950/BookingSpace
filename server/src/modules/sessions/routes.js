import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { availability } from './controller.js';
import { availabilitySchema } from './schema.js';

const router = Router({ mergeParams: true });
router.get('/', validate(availabilitySchema), availability);

export default router;
