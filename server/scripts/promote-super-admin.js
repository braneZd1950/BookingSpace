/**
 * Ručno promoviraj postojećeg korisnika u super admina (role: ADMIN).
 *
 * Primjer (iz server/):
 *   node scripts/promote-super-admin.js admin@anyminutes.hr
 *
 * Super admin se NE stvara preko /admin UI — samo ovako ili direktno u MongoDB.
 */
import { connectDb, disconnectDb } from '../src/config/db.js';
import User from '../src/models/User.js';

const email = String(process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Uporaba: node scripts/promote-super-admin.js email@domena.hr');
  process.exit(1);
}

await connectDb();
const user = await User.findOne({ email });
if (!user) {
  console.error(`Nema korisnika s e-poštom ${email}. Prvo registrirajte račun na /register.`);
  await disconnectDb();
  process.exit(1);
}

user.role = 'ADMIN';
await user.save();
console.log(`OK: ${user.email} je sada ADMIN (super admin). Prijava: /login → /admin`);
await disconnectDb();
