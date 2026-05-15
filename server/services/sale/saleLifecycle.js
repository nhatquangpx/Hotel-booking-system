const SalePromotion = require("../../models/SalePromotion");
const { vnDateKey, isSaleOpen, toHotelObjectIds } = require("./saleShared");

async function deactivateExpiredSales(filter = {}) {
  const ymdToday = vnDateKey();
  const result = await SalePromotion.updateMany(
    { isActive: true, endDate: { $lt: ymdToday }, ...filter },
    { $set: { isActive: false } }
  );
  return result.modifiedCount ?? 0;
}

async function deactivateAllExpiredSales() {
  return deactivateExpiredSales();
}

async function deactivateExpiredSalesForHotelIds(hotelIds) {
  const oids = toHotelObjectIds(hotelIds);
  if (oids.length === 0) return 0;
  return deactivateExpiredSales({ hotelId: { $in: oids } });
}

function enrichSaleForOwner(sale, asOfYmd = vnDateKey()) {
  return {
    ...sale,
    isOpen: isSaleOpen(sale, asOfYmd),
  };
}

/** isActive khi tạo/cập nhật: tắt nếu đã qua endDate; không bật sale đã hết hạn. */
/** @param {boolean|undefined} requestedActive — đã parse từ request */
function resolveIsActiveOnSave(endDate, requestedActive, asOfYmd = vnDateKey()) {
  if (endDate < asOfYmd) return false;
  if (requestedActive === undefined) return true;
  return requestedActive === true;
}

module.exports = {
  deactivateAllExpiredSales,
  deactivateExpiredSalesForHotelIds,
  enrichSaleForOwner,
  resolveIsActiveOnSave,
};
