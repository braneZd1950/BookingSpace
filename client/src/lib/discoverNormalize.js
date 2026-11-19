import {
  allowsOnlineBookingFromDiscover,
  DISCOVER_VISIBILITY,
  isDiscoverExcludedTenant,
  isListedOnDiscover,
} from './discoverVisibility.js';
import { toPublicDiscoverCategory } from './discoverCategories.js';

/**
 * Normalize a discover API row for public Otkrij lists.
 * @param {object} place
 * @param {{ missingVisibility?: string }} [options]
 */
export function normalizeDiscoverPlace(place, options = {}) {
  const missingVisibility = options.missingVisibility || DISCOVER_VISIBILITY.PRIVATE;
  const slug = String(place.slug || '').trim();
  if (!slug || !place.live) return null;
  if (isDiscoverExcludedTenant({ slug, name: place.name })) return null;

  const visibility = place.discoverVisibility || missingVisibility;
  if (!isListedOnDiscover(visibility)) return null;

  const categoryId = toPublicDiscoverCategory(place.categoryId || place.niche);
  if (!categoryId) return null;

  return {
    ...place,
    categoryId,
    name: place.name,
    city: place.city || '',
    area: place.area || '',
    note: place.note || '',
    tags: place.tags || [],
    slug,
    live: true,
    discoverVisibility: visibility,
    onlineBooking: allowsOnlineBookingFromDiscover(visibility),
  };
}
