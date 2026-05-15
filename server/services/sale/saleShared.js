const mongoose = require("mongoose");

function vnDateKey(d = new Date()) {
  return new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

/** Sale còn mở (owner bật và chưa qua ngày kết thúc lưu trú). */
function isSaleOpen(sale, asOfYmd = vnDateKey()) {
  return !!sale?.isActive && sale.endDate >= asOfYmd;
}

/** Bộ lọc read-only: sale đang mở tại một ngày tham chiếu. */
function activeSaleOnDateFilter(asOfYmd = vnDateKey()) {
  return {
    isActive: true,
    startDate: { $lte: asOfYmd },
    endDate: { $gte: asOfYmd },
  };
}

/** Bộ lọc read-only: sale overlap kỳ lưu trú [minNightKey, maxNightKey]. */
function saleOverlapStayFilter(minNightKey, maxNightKey) {
  return {
    isActive: true,
    startDate: { $lte: maxNightKey },
    endDate: { $gte: minNightKey },
  };
}

function toHotelObjectIds(hotelIds) {
  const oids = [];
  for (const id of hotelIds || []) {
    if (id == null) continue;
    const s = String(id);
    if (!mongoose.isValidObjectId(s)) continue;
    oids.push(new mongoose.Types.ObjectId(s));
  }
  return oids;
}

module.exports = {
  vnDateKey,
  isSaleOpen,
  activeSaleOnDateFilter,
  saleOverlapStayFilter,
  toHotelObjectIds,
};
