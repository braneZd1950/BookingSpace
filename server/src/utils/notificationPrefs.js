export const DEFAULT_NOTIFICATION_PREFS = {
  bookingEmail: true,
  cancelEmail: true,
  memberEmail: true,
  weeklyDigest: false,
  marketing: false,
  bookingPush: true,
  cancelPush: true,
  memberPush: true,
  reminderPush: false,
};

export function mergeNotificationPrefs(raw) {
  return {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...(raw?.toObject?.() || raw || {}),
  };
}
