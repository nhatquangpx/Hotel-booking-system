const DEFAULT_REFRESH_DAYS = 7;

const parseRefreshDays = () => {
  const raw = process.env.JWT_REFRESH_DAYS;
  if (raw == null || String(raw).trim() === "") return DEFAULT_REFRESH_DAYS;

  const days = parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(days) || days <= 0) {
    console.warn(
      `[auth] JWT_REFRESH_DAYS="${raw}" is invalid (expected a positive integer). Using ${DEFAULT_REFRESH_DAYS} days.`
    );
    return DEFAULT_REFRESH_DAYS;
  }
  return days;
};

const REFRESH_DAYS = parseRefreshDays();
const REFRESH_MS = REFRESH_DAYS * 24 * 60 * 60 * 1000;

module.exports = { DEFAULT_REFRESH_DAYS, REFRESH_DAYS, REFRESH_MS, parseRefreshDays };
