// /auth/me returns 401 for an invalid/expired session and 403 for a blocked
// account. Transport failures and unrelated HTTP errors must preserve the
// cached session so a temporarily unavailable API does not log the user out.
export const shouldClearAuthSession = (error) =>
  error?.status === 401 || error?.status === 403;
