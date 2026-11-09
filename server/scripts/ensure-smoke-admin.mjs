/**
 * Ensure ADMIN user exists for local smoke (sets password + role).
 * Usage: node scripts/ensure-smoke-admin.mjs [email] [password]
 */
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../src/config/db.js';
import User from '../src/models/User.js';

const email = String(process.argv[2] || process.env.SMOKE_ADMIN_EMAIL || 'admin@gmail.com')
  .trim()
  .toLowerCase();
const password = String(process.argv[3] || process.env.SMOKE_ADMIN_PASS || 'Smoke-Admin-Pass-123!');

if (!email || password.length < 10) {
  console.error('Need email and password (≥10 chars)');
  process.exit(1);
}

await connectDb();
let user = await User.findOne({ email });
const hash = await bcrypt.hash(password, 12);

if (!user) {
  user = await User.create({
    name: 'Smoke Admin',
    email,
    passwordHash: hash,
    role: 'ADMIN',
  });
  console.log(`CREATED ADMIN ${email}`);
} else {
  user.passwordHash = hash;
  user.role = 'ADMIN';
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  console.log(`UPDATED ADMIN ${email}`);
}

await disconnectDb();
console.log(JSON.stringify({ email, role: user.role, ready: true }));
