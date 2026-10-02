import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import { HttpError } from '../../utils/httpError.js';
import { signAccessToken } from '../../utils/token.js';

const BCRYPT_ROUNDS = 12;
const dummyHash = bcrypt.hashSync('timing-only-secret', BCRYPT_ROUNDS);

export function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function registerUser(input) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: input.role,
    });

    return {
      user: toPublicUser(user),
      token: signAccessToken(user),
    };
  } catch (error) {
    if (error?.code === 11000) {
      throw new HttpError(409, 'Email already registered', { code: 'EMAIL_TAKEN' });
    }
    throw error;
  }
}

export async function loginUser(input) {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  const passwordOk = await bcrypt.compare(input.password, user?.passwordHash || dummyHash);

  if (!user || !passwordOk) {
    throw new HttpError(401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
  }

  return {
    user: toPublicUser(user),
    token: signAccessToken(user),
  };
}
