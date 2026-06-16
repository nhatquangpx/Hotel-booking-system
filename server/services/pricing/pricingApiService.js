const dynamicPricingService = require("./dynamicPricingService");
const { ServiceError } = require("../../lib/http/serviceError");

function mapPricingError(error) {
  if (error instanceof ServiceError) throw error;
  const msg = error?.message || "Lỗi xử lý giá động";
  if (msg.includes("không có quyền") || msg.includes("Không tìm thấy")) {
    throw new ServiceError(403, msg);
  }
  if (msg.includes("không hợp lệ")) {
    throw new ServiceError(400, msg);
  }
  throw error;
}

async function getDynamicPricing({ ownerId, hotelId, days }) {
  try {
    const body = await dynamicPricingService.getDynamicPricingForOwner(ownerId, {
      hotelId: hotelId || undefined,
      days: days != null ? parseInt(days, 10) : undefined,
    });
    return { status: 200, body };
  } catch (error) {
    mapPricingError(error);
  }
}

async function applySuggestedPrices({ ownerId, hotelId, roomType, days, date }) {
  try {
    const body = await dynamicPricingService.applySuggestedPricesForOwner(ownerId, {
      hotelId,
      roomType,
      days: days != null ? parseInt(days, 10) : undefined,
      date: date || undefined,
    });
    return { status: 200, body };
  } catch (error) {
    mapPricingError(error);
  }
}

module.exports = { getDynamicPricing, applySuggestedPrices };
