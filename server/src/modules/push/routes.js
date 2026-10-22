import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { mine, publicConfig, subscribe, unsubscribe } from './controller.js';
import { subscribePushSchema, unsubscribePushSchema } from './schema.js';

const pushRoutes = Router();

pushRoutes.get('/vapid-public-key', publicConfig);
pushRoutes.get('/subscriptions', requireAuth, mine);
pushRoutes.post('/subscribe', requireAuth, validate(subscribePushSchema), subscribe);
pushRoutes.post('/unsubscribe', requireAuth, validate(unsubscribePushSchema), unsubscribe);

export default pushRoutes;
