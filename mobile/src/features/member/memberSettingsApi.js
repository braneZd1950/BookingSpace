/** Re-export auth/consent helpers used by MemberSettingsScreen. */
export {
  changePassword,
  deleteMyAccount,
  exportMyData,
  getMe,
  logoutAll,
  resendEmailChange,
  updateMe,
} from '../../api/auth.js';

export { recordConsent as recordConsentWait } from '../../api/consent.js';
