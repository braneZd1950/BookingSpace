import User from '../models/User.js';
import { HttpError } from '../utils/httpError.js';
import { verifyAccessToken } from '../utils/token.js';

export async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    next(new HttpError(401, 'Unauthorized'));
    return;
  }

  try {
    const payload = verifyAccessToken(match[1]);
    const user = await User.findById(payload.sub);
    if (!user) {
      next(new HttpError(401, 'Unauthorized'));
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
