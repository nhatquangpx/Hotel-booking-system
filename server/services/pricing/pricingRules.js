const WD_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LOOKBACK_DAYS = 84;
const MULTIPLIER_DAMPING = 0.55;
const PRICE_CLAMP_MIN_RATIO = 0.75;
const PRICE_CLAMP_MAX_RATIO = 1.35;
const ROUND_VND_STEP = 10000;

function vnWeekdayIndex(date) {
  const w = date.toLocaleDateString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
  });
  const i = WD_SHORT.indexOf(w);
  return i >= 0 ? i : 0;
}

function vnDateKey(date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function vnDayBoundsFromKey(dateKey) {
  const start = new Date(`${dateKey}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

function roundVnd(amount) {
  return Math.round(amount / ROUND_VND_STEP) * ROUND_VND_STEP;
}

function occupancyMultiplier(rate) {
  if (rate >= 0.9) return 1.12;
  if (rate >= 0.75) return 1.08;
  if (rate >= 0.5) return 1.02;
  if (rate <= 0.15) return 0.88;
  if (rate <= 0.25) return 0.92;
  return 1;
}

function seasonMultiplierForDateKey(dateKey) {
  const [, m, d] = dateKey.split("-").map(Number);
  const month = m;
  const day = d;

  if (month === 12 && day >= 20) return 1.1;
  if (month === 1 && day <= 5) return 1.1;
  if (month === 4 && day >= 28 && day <= 30) return 1.06;
  if (month === 5 && day <= 2) return 1.06;
  if (month >= 6 && month <= 8) return 1.04;
  return 1;
}

function accumulateWeekdayNightCountsByType(bookings, lookbackStart, lookbackEnd = null) {
  /** @type {Record<string, number[]>} */
  const byType = {};
  const endBound = lookbackEnd ? lookbackEnd.getTime() : Infinity;

  for (const b of bookings) {
    const rt = b.room?.type;
    if (!rt) continue;
    if (!byType[rt]) byType[rt] = [0, 0, 0, 0, 0, 0, 0];
    let night = new Date(b.checkInDate);
    const checkout = new Date(b.checkOutDate);
    while (night < checkout) {
      if (night >= lookbackStart && night.getTime() < endBound) {
        byType[rt][vnWeekdayIndex(night)] += 1;
      }
      night = new Date(night.getTime() + 86400000);
    }
  }
  return byType;
}

function historicalWeekdayMultipliers(weekdayNightCounts) {
  const maxC = Math.max(...weekdayNightCounts, 0);
  if (maxC === 0) {
    return [1, 1, 1, 1, 1, 1, 1];
  }
  return weekdayNightCounts.map((c) => 0.88 + 0.22 * (c / maxC));
}

function dampCombinedMultiplier(product) {
  return 1 + (product - 1) * MULTIPLIER_DAMPING;
}

/**
 * @param {number} avgCurrentNightly
 * @param {{
 *   occupancyRate?: number,
 *   dateKey: string,
 *   histMult?: number,
 *   factors?: { occupancy?: boolean, season?: boolean, historicalWeekday?: boolean },
 *   useDamping?: boolean,
 * }} options
 */
function computeSuggestedNightly(avgCurrentNightly, options) {
  const {
    occupancyRate = 0,
    dateKey,
    histMult = 1,
    factors = {},
    useDamping = true,
  } = options;

  const occMult =
    factors.occupancy === false ? 1 : occupancyMultiplier(occupancyRate);
  const seaMult =
    factors.season === false ? 1 : seasonMultiplierForDateKey(dateKey);
  const hist = factors.historicalWeekday === false ? 1 : histMult;

  const minP = avgCurrentNightly * PRICE_CLAMP_MIN_RATIO;
  const maxP = avgCurrentNightly * PRICE_CLAMP_MAX_RATIO;
  const rawProduct = occMult * seaMult * hist;
  const dampedMult = useDamping ? dampCombinedMultiplier(rawProduct) : rawProduct;
  const rawBeforeClamp = avgCurrentNightly * dampedMult;
  const afterClamp = Math.min(maxP, Math.max(minP, rawBeforeClamp));

  return {
    suggestedNightly: roundVnd(afterClamp),
    occMult,
    seaMult,
    histMult: hist,
    rawProduct,
    dampedMult,
    rawBeforeClamp,
    afterClamp,
    minP,
    maxP,
  };
}

module.exports = {
  WD_SHORT,
  LOOKBACK_DAYS,
  MULTIPLIER_DAMPING,
  PRICE_CLAMP_MIN_RATIO,
  PRICE_CLAMP_MAX_RATIO,
  vnWeekdayIndex,
  vnDateKey,
  vnDayBoundsFromKey,
  roundVnd,
  occupancyMultiplier,
  seasonMultiplierForDateKey,
  accumulateWeekdayNightCountsByType,
  historicalWeekdayMultipliers,
  dampCombinedMultiplier,
  computeSuggestedNightly,
};
