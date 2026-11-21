/** Shared member settings save orchestration (web + mobile). */

import {
  MEMBER_SETTINGS_MESSAGES,
  apiErrorMessage,
  buildDeleteAccountBody,
  emailChangeNoteFromResult,
  emailChangeResentMessage,
  memberNotificationPrefsPayload,
  prepareAccountUpdate,
  prepareEmailChange,
  preparePasswordChange,
  uiThemeSavedMessage,
} from './memberAccountSettings.js';

export function createMemberSettingsFeedback(setNotes, setErrors) {
  return {
    clear(key) {
      setNotes((current) => ({ ...current, [key]: '' }));
      setErrors((current) => ({ ...current, [key]: '' }));
    },
    setNote(key, text) {
      setNotes((current) => ({ ...current, [key]: text }));
    },
    setError(key, text) {
      setErrors((current) => ({ ...current, [key]: text }));
    },
  };
}

export async function saveMemberAccount(account, updateMe, feedback) {
  feedback.clear('account');
  const prepared = prepareAccountUpdate(account);
  if (prepared.error) {
    feedback.setError('account', prepared.error);
    return { ok: false };
  }
  try {
    await updateMe(prepared.payload);
    feedback.setNote('account', MEMBER_SETTINGS_MESSAGES.accountSaved);
    return { ok: true };
  } catch (err) {
    feedback.setError('account', apiErrorMessage(err, MEMBER_SETTINGS_MESSAGES.accountSaveFailed));
    return { ok: false };
  }
}

export async function saveMemberEmailChange(
  emailDraft,
  currentEmail,
  updateMe,
  feedback,
  onSuccess,
) {
  feedback.clear('email');
  const prepared = prepareEmailChange(emailDraft, currentEmail);
  if (prepared.error) {
    feedback.setError('email', prepared.error);
    return { ok: false };
  }
  try {
    const result = await updateMe(prepared.payload);
    onSuccess?.(result, prepared.payload.email);
    feedback.setNote('email', emailChangeNoteFromResult(result, prepared.payload.email));
    return { ok: true, result, email: prepared.payload.email };
  } catch (err) {
    feedback.setError('email', apiErrorMessage(err, MEMBER_SETTINGS_MESSAGES.emailUpdateFailed));
    return { ok: false };
  }
}

export async function resendMemberEmailChange(resend, feedback) {
  feedback.clear('email');
  try {
    const result = await resend();
    feedback.setNote('email', emailChangeResentMessage(result.pendingEmail));
    return { ok: true };
  } catch {
    feedback.setError('email', MEMBER_SETTINGS_MESSAGES.emailResendFailed);
    return { ok: false };
  }
}

export async function saveMemberUiTheme(nextRaw, {
  normalizeUiTheme,
  syncUiTheme,
  updateMe,
  feedback,
  onApply,
}) {
  const value = normalizeUiTheme(nextRaw);
  onApply?.(value);
  syncUiTheme(value);
  feedback.setNote('theme', '');
  try {
    await updateMe({ uiTheme: value });
    feedback.setNote('theme', uiThemeSavedMessage(value));
    return { ok: true, value };
  } catch {
    feedback.setNote('theme', MEMBER_SETTINGS_MESSAGES.themeLocalOnly);
    return { ok: false, value };
  }
}

export async function saveMemberNotificationPrefs(prefs, updateMe, feedback) {
  feedback.setNote('prefs', '');
  try {
    await updateMe({
      notificationPrefs: memberNotificationPrefsPayload(prefs),
    });
    feedback.setNote('prefs', MEMBER_SETTINGS_MESSAGES.prefsSaved);
    return { ok: true };
  } catch {
    feedback.setNote('prefs', MEMBER_SETTINGS_MESSAGES.prefsSaveFailed);
    return { ok: false };
  }
}

export async function changeMemberPassword(password, changePassword, feedback, {
  onToken,
  onReauth,
  resetPassword,
} = {}) {
  feedback.clear('password');
  const prepared = preparePasswordChange(password);
  if (prepared.error) {
    feedback.setError('password', prepared.error);
    return { ok: false };
  }
  try {
    const result = await changePassword(prepared.payload);
    if (result?.token) {
      await onToken?.(result.token);
    } else if (onReauth) {
      await onReauth();
      resetPassword?.();
      feedback.setNote('password', MEMBER_SETTINGS_MESSAGES.passwordSavedReauth);
      return { ok: true, reauth: true };
    }
    resetPassword?.();
    feedback.setNote('password', MEMBER_SETTINGS_MESSAGES.passwordSaved);
    return { ok: true, token: result?.token };
  } catch (err) {
    feedback.setError('password', apiErrorMessage(err, MEMBER_SETTINGS_MESSAGES.passwordChangeFailed));
    return { ok: false };
  }
}

export async function deleteMemberAccount(hasPassword, secret, deleteAccount, feedback, onSuccess) {
  feedback.clear('delete');
  try {
    await deleteAccount(buildDeleteAccountBody(hasPassword, secret));
    await onSuccess?.();
    feedback.setNote('delete', MEMBER_SETTINGS_MESSAGES.deleteSuccess);
    return { ok: true };
  } catch (err) {
    feedback.setError('delete', apiErrorMessage(err, MEMBER_SETTINGS_MESSAGES.deleteFailed));
    return { ok: false };
  }
}
