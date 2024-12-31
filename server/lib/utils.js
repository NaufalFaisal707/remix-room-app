/**
 * Checks if a refresh token is accessible based on its issued-at time and logout time
 * @param {number} refreshIat - Refresh token issued-at timestamp in seconds
 * @param {Date} logoutAt - Logout date
 * @returns {boolean} True if refresh token is accessible, false otherwise
 */
export function isRefreshTokenAccessable(refreshIat, logoutAt) {
  return refreshIat * 1000 < new Date(logoutAt).getTime();
}
