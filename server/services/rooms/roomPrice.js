/** Đọc giá đêm từ room.price (số). */
function readRoomPrice(price) {
  if (price == null) return 0;
  if (typeof price === "number" && Number.isFinite(price)) {
    return Math.max(0, price);
  }
  const n = Number(price);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** Chuẩn hoá input API/form thành số giá đêm. */
function normalizeRoomPriceInput(price) {
  return readRoomPrice(price);
}

module.exports = { readRoomPrice, normalizeRoomPriceInput };
