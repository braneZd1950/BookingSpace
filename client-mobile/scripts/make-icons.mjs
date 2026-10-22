import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = path.dirname(fileURLToPath(import.meta.url));
const mobileIcons = path.resolve(root, '../public/icons');
const clientIcons = path.resolve(root, '../../client/public/icons');
const svg = fs.readFileSync(path.join(mobileIcons, 'icon.svg'));

fs.mkdirSync(mobileIcons, { recursive: true });
fs.mkdirSync(clientIcons, { recursive: true });

for (const size of [180, 192, 512]) {
  const name = `icon-${size}.png`;
  const buf = await sharp(svg).resize(size, size).png().toBuffer();
  fs.writeFileSync(path.join(mobileIcons, name), buf);
  fs.writeFileSync(path.join(clientIcons, name), buf);
  console.log('wrote', name);
}

fs.copyFileSync(path.join(mobileIcons, 'icon.svg'), path.join(clientIcons, 'icon.svg'));
console.log('done');
