/**
 * Chuẩn hoá message lỗi từ API (axios / throw object / string).
 */
export function apiErrorMessage(err, fallback = 'Đã xảy ra lỗi') {
  if (typeof err === 'string' && err.trim()) return err;
  if (err && typeof err === 'object') {
    return err.response?.data?.message || err.message || fallback;
  }
  return fallback;
}
