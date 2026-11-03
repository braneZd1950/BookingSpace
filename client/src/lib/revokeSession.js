const TOKEN_KEY = 'bookingspace.token';

/** Best-effort server revoke so stolen JWTs stop working after logout. */
export async function revokeServerSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';
  try {
    await fetch(`${base.replace(/\/$/, '')}/auth/logout`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
  } catch {
    // Local logout still proceeds if the network fails.
  }
}
