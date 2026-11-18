import { BRAND } from '../lib/brand.js';
import './BrandWordmark.scss';

/**
 * Official Blizari wordmark lockup (PNG) — sized via CSS for each slot.
 * @param {'home' | 'header' | 'footer' | 'spine' | 'page' | 'banner' | 'watermark'} slot
 * @param {'dark' | 'light'} tone — dark ink on light UI, light ink on blue/navy
 */
export default function BrandWordmark({
  slot = 'home',
  tone = 'dark',
  className = '',
  decorative = false,
}) {
  const src = tone === 'light'
    ? '/icons/blizari-wordmark-on-dark.png'
    : '/icons/blizari-wordmark.png';

  const classes = [
    'brand-wordmark',
    `brand-wordmark--${slot}`,
    `brand-wordmark--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <img
      className={classes}
      src={src}
      alt={decorative ? '' : BRAND.name}
      width={480}
      height={140}
      decoding="async"
      draggable={false}
    />
  );
}
