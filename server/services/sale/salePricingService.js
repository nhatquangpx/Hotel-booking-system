const mongoose = require("mongoose");
const SalePromotion = require("../../models/SalePromotion");
const { vnDateKey, saleOverlapStayFilter } = require("./saleShared");

function effectiveNightlyBase(room) {
  const r = room.price?.regular ?? 0;
  const disc = room.price?.discount ?? 0;
  return Math.max(0, r - disc);
}

function nightDateKeysVN(checkIn, checkOut) {
  const keys = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  let cur = new Date(start);
  while (cur < end) {
    keys.push(vnDateKey(cur));
    cur = new Date(cur.getTime() + 86400000);
  }
  return keys;
}

function saleAppliesToNight(sale, roomType, nightKey) {
  if (nightKey < sale.startDate || nightKey > sale.endDate) return false;
  if (sale.scope === "hotel") return true;
  return sale.roomType === roomType;
}

function pickBestSaleForNight(sales, roomType, nightKey) {
  let best = null;
  for (const s of sales) {
    if (!s.isActive || !saleAppliesToNight(s, roomType, nightKey)) continue;
    if (!best || s.discountPercent > best.discountPercent) best = s;
  }
  return best;
}

function computeStaySalePricingFromSales(room, checkIn, checkOut, sales = []) {
  const nights = nightDateKeysVN(checkIn, checkOut);
  if (nights.length === 0) {
    throw new Error("Kỳ lưu trú không hợp lệ");
  }

  const nightlyBase = effectiveNightlyBase(room);
  let basePrice = 0;
  let discountAmount = 0;
  const discountBySaleId = new Map();

  for (const nightKey of nights) {
    basePrice += nightlyBase;
    const best = pickBestSaleForNight(sales, room.type, nightKey);
    if (!best || nightlyBase <= 0) continue;
    const nightDisc = Math.round((nightlyBase * best.discountPercent) / 100);
    discountAmount += nightDisc;
    const sid = String(best._id);
    discountBySaleId.set(sid, (discountBySaleId.get(sid) || 0) + nightDisc);
  }

  let dominantSale = null;
  let maxContrib = 0;
  for (const s of sales) {
    const v = discountBySaleId.get(String(s._id)) || 0;
    if (v > maxContrib) {
      maxContrib = v;
      dominantSale = s;
    }
  }

  const finalAmount = Math.max(0, basePrice - discountAmount);

  let promotionApplied = null;
  if (dominantSale && discountAmount > 0) {
    promotionApplied = {
      sale: dominantSale._id,
      title: dominantSale.title,
      discountPercent: dominantSale.discountPercent,
    };
  }

  const displayPercentOff =
    basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;

  return {
    nights: nights.length,
    nightlyBase,
    basePrice,
    discountAmount,
    finalAmount,
    promotionApplied,
    displayPercentOff,
    finalNightly:
      nights.length > 0 ? Math.round(finalAmount / nights.length) : finalAmount,
  };
}

async function loadSalesOverlappingStay(hotelId, checkIn, checkOut) {
  if (!mongoose.isValidObjectId(hotelId)) {
    throw new Error("hotelId không hợp lệ");
  }

  const nights = nightDateKeysVN(checkIn, checkOut);
  if (nights.length === 0) return [];

  return SalePromotion.find({
    hotelId: new mongoose.Types.ObjectId(String(hotelId)),
    ...saleOverlapStayFilter(nights[0], nights[nights.length - 1]),
  }).lean();
}

async function computeStaySalePricing(room, hotelId, checkIn, checkOut) {
  const sales = await loadSalesOverlappingStay(hotelId, checkIn, checkOut);
  return computeStaySalePricingFromSales(room, checkIn, checkOut, sales);
}

module.exports = {
  effectiveNightlyBase,
  computeStaySalePricingFromSales,
  computeStaySalePricing,
  loadSalesOverlappingStay,
};
