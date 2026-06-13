const mongoose = require("mongoose");
const SalePromotion = require("../../models/SalePromotion");
const Hotel = require("../../models/Hotel");
const { vnDateKey } = require("./saleShared");
const {
  deactivateExpiredSalesForHotelIds,
  enrichSaleForOwner,
  resolveIsActiveOnSave,
} = require("./saleLifecycle");
const { parseRequiredBoolean } = require("../../lib/http/parseBoolean");
const {
  parseSalePayload,
  validateSalePayload,
  normalizePayloadIsActive,
} = require("../../validations/saleValidation");
const { ServiceError } = require("../../lib/http/serviceError");

async function assertOwnerHotel(ownerId, hotelId) {
  if (!mongoose.isValidObjectId(hotelId)) {
    throw new ServiceError(400, "hotelId không hợp lệ");
  }
  const hotel = await Hotel.findById(hotelId).select("ownerId").lean();
  if (!hotel) throw new ServiceError(404, "Không tìm thấy khách sạn");
  if (String(hotel.ownerId) !== String(ownerId)) {
    throw new ServiceError(403, "Không có quyền truy cập khách sạn này");
  }
}

function applyScopeToDoc(doc, scope, roomType) {
  if (scope === "hotel") doc.roomType = undefined;
  else if (scope === "room_type") doc.roomType = roomType;
}

async function listSales({ ownerId, hotelId }) {
  if (!hotelId) throw new ServiceError(400, "Vui lòng cung cấp hotelId");
  await assertOwnerHotel(ownerId, hotelId);

  const ymdToday = vnDateKey();
  const list = await SalePromotion.find({ hotelId }).sort({ startDate: -1, createdAt: -1 }).lean();
  return { status: 200, body: list.map((s) => enrichSaleForOwner(s, ymdToday)) };
}

async function createSale({ ownerId, body }) {
  const payload = parseSalePayload(body);
  const errMsg = validateSalePayload(payload);
  if (errMsg) throw new ServiceError(400, errMsg);

  await assertOwnerHotel(ownerId, payload.hotelId);
  const ymdToday = vnDateKey();

  const doc = {
    hotelId: payload.hotelId,
    title: payload.title,
    scope: payload.scope,
    startDate: payload.startDate,
    endDate: payload.endDate,
    discountPercent: payload.discountPercent,
    isActive: resolveIsActiveOnSave(payload.endDate, payload.isActive, ymdToday),
  };
  applyScopeToDoc(doc, payload.scope, payload.roomType);

  const sale = await new SalePromotion(doc).save();
  return { status: 201, body: enrichSaleForOwner(sale.toObject(), ymdToday) };
}

async function updateSale({ ownerId, id, body }) {
  if (!mongoose.isValidObjectId(id)) throw new ServiceError(400, "ID không hợp lệ");

  const existing = await SalePromotion.findById(id);
  if (!existing) throw new ServiceError(404, "Không tìm thấy chương trình sale");
  await assertOwnerHotel(ownerId, existing.hotelId);

  const payload = parseSalePayload(body, { partial: true });
  const isActiveErr = normalizePayloadIsActive(payload);
  if (isActiveErr) throw new ServiceError(400, isActiveErr);

  const errMsg = validateSalePayload(
    {
      scope: payload.scope ?? existing.scope,
      roomType: payload.roomType ?? existing.roomType,
      startDate: payload.startDate ?? existing.startDate,
      endDate: payload.endDate ?? existing.endDate,
      discountPercent: payload.discountPercent ?? existing.discountPercent,
    },
    { partial: true }
  );
  if (errMsg) throw new ServiceError(400, errMsg);

  const ymdToday = vnDateKey();
  if (payload.title !== undefined) existing.title = payload.title;
  if (payload.scope != null) existing.scope = payload.scope;
  if (payload.roomType !== undefined) existing.roomType = payload.roomType;
  if (payload.startDate != null) existing.startDate = payload.startDate;
  if (payload.endDate != null) existing.endDate = payload.endDate;
  if (payload.discountPercent != null) existing.discountPercent = payload.discountPercent;

  if (payload.isActive !== undefined) {
    if (payload.isActive === true && existing.endDate < ymdToday) {
      throw new ServiceError(
        400,
        "Chương trình đã hết hạn, không thể mở lại. Hãy kéo dài ngày kết thúc lưu trú."
      );
    }
    existing.isActive = payload.isActive;
  }

  applyScopeToDoc(existing, existing.scope, existing.roomType);
  if (existing.scope === "room_type" && !existing.roomType) {
    throw new ServiceError(400, "Cần loại phòng");
  }
  if (existing.endDate < existing.startDate) {
    throw new ServiceError(400, "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
  }

  existing.isActive = resolveIsActiveOnSave(existing.endDate, existing.isActive, ymdToday);
  await existing.save();
  return { status: 200, body: enrichSaleForOwner(existing.toObject(), ymdToday) };
}

async function setSaleStatus({ ownerId, id, isActive }) {
  if (!mongoose.isValidObjectId(id)) throw new ServiceError(400, "ID không hợp lệ");

  const existing = await SalePromotion.findById(id);
  if (!existing) throw new ServiceError(404, "Không tìm thấy chương trình sale");
  await assertOwnerHotel(ownerId, existing.hotelId);

  const ymdToday = vnDateKey();
  if (isActive === true && existing.endDate < ymdToday) {
    throw new ServiceError(
      400,
      "Chương trình đã hết hạn, không thể mở lại. Hãy kéo dài ngày kết thúc lưu trú."
    );
  }

  existing.isActive = isActive;
  await existing.save();
  return { status: 200, body: enrichSaleForOwner(existing.toObject(), ymdToday) };
}

async function syncExpiredSales({ ownerId, hotelId }) {
  if (!hotelId) throw new ServiceError(400, "Vui lòng cung cấp hotelId");
  await assertOwnerHotel(ownerId, hotelId);
  const modifiedCount = await deactivateExpiredSalesForHotelIds([hotelId]);
  return { status: 200, body: { ok: true, modifiedCount } };
}

async function deactivateSale({ ownerId, id }) {
  if (!mongoose.isValidObjectId(id)) throw new ServiceError(400, "ID không hợp lệ");

  const existing = await SalePromotion.findById(id);
  if (!existing) throw new ServiceError(404, "Không tìm thấy chương trình sale");
  await assertOwnerHotel(ownerId, existing.hotelId);

  existing.isActive = false;
  await existing.save();
  return { status: 200, body: { ok: true, sale: enrichSaleForOwner(existing.toObject(), vnDateKey()) } };
}

module.exports = {
  listSales,
  createSale,
  updateSale,
  setSaleStatus,
  syncExpiredSales,
  deactivateSale,
};
