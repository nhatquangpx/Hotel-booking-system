const dynamicPricingService = require("../services/pricing/dynamicPricingService");

/**
 * GET /api/owner/pricing/dynamic?hotelId=&days=
 * Gợi ý giá động theo ngày cho Owner (rule-based).
 */
exports.getDynamicPricing = async (req, res) => {
  try {
    const { hotelId, days } = req.query;
    const result = await dynamicPricingService.getDynamicPricingForOwner(req.user.id, {
      hotelId: hotelId || undefined,
      days: days ? parseInt(days, 10) : undefined,
    });
    res.json(result);
  } catch (error) {
    console.error("Lỗi dynamic pricing:", error);
    const msg = error.message || "Lỗi tính giá đề xuất";
    const status =
      msg.includes("không có quyền") || msg.includes("Không tìm thấy") ? 403 : msg.includes("không hợp lệ") ? 400 : 500;
    res.status(status).json({ message: msg });
  }
};

/**
 * POST /api/owner/pricing/apply-suggested
 * Body: { hotelId, roomType, days } — gán giá regular = TB giá đề xuất trong kỳ, discount = 0.
 */
exports.applySuggestedPrices = async (req, res) => {
  try {
    const { hotelId, roomType, days } = req.body || {};
    const result = await dynamicPricingService.applySuggestedPricesForOwner(req.user.id, {
      hotelId,
      roomType,
      days: days != null ? parseInt(days, 10) : undefined,
    });
    res.json(result);
  } catch (error) {
    console.error("Lỗi áp dụng giá gợi ý:", error);
    const msg = error.message || "Lỗi áp dụng giá gợi ý";
    const status =
      msg.includes("không có quyền") || msg.includes("Không tìm thấy") ? 403 : msg.includes("không hợp lệ") ? 400 : 500;
    res.status(status).json({ message: msg });
  }
};
