export const DEFAULT_NOTIFICATION_PREFS = {
  bookingEmail: true,
  cancelEmail: true,
  memberEmail: true,
  weeklyDigest: false,
  marketing: false,
  marketingStudio: false,
  marketingPlatform: false,
  bookingPush: true,
  cancelPush: true,
  memberPush: true,
  reminderPush: false,
};

export function mergeNotificationPrefs(raw) {
  const incoming = raw?.toObject?.() || raw || {};
  const merged = {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...incoming,
  };
  // Legacy single marketing flag → studio only (never auto-enable platform).
  if (incoming.marketingStudio === undefined && incoming.marketing === true) {
    merged.marketingStudio = true;
  }
  if (incoming.marketingPlatform === undefined) {
    merged.marketingPlatform = false;
  }
  return merged;
}
