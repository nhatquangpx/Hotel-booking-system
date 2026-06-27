const DEFAULT_HOLD_MINUTES = 30;

function getPendingHoldMinutes() {
  const raw = process.env.BOOKING_PENDING_HOLD_MINUTES;
  const parsed = Number(raw);
  if (!raw || Number.isNaN(parsed) || parsed < 5) {
    return DEFAULT_HOLD_MINUTES;
  }
  return Math.min(parsed, 24 * 60);
}

function computePendingExpiresAt(fromDate = new Date()) {
  const minutes = getPendingHoldMinutes();
  return new Date(fromDate.getTime() + minutes * 60 * 1000);
}

module.exports = {
  DEFAULT_HOLD_MINUTES,
  getPendingHoldMinutes,
  computePendingExpiresAt,
};
