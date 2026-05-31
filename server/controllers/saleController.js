const mongoose = require("mongoose");
const SalePromotion = require("../models/SalePromotion");
const Hotel = require("../models/Hotel");
const { vnDateKey } = require("../services/sale/saleShared");
const {
  deactivateExpiredSalesForHotelIds,
  enrichSaleForOwner,
  resolveIsActiveOnSave,
} = require("../services/sale/saleLifecycle");
const { parseRequiredBoolean } = require("../utils/parseBoolean");
const {
  parseSalePayload,
  validateSalePayload,
  normalizePayloadIsActive,
} = require("../validations/saleValidation");

function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

async function assertOwnerHotel(ownerId, hotelId) {
  if (!mongoose.isValidObjectId(hotelId)) {
    throw httpError(400, "hotelId không hợp lệ");
  }
  const hotel = await Hotel.findById(hotelId).select("ownerId").lean();
  if (!hotel) {
    throw httpError(404, "Không tìm thấy khách sạn");
  }
  if (String(hotel.ownerId) !== String(ownerId)) {
    throw httpError(403, "Không có quyền truy cập khách sạn này");
  }
}

function statusFromError(error) {
  if (typeof error.statusCode === "number" && error.statusCode >= 400 && error.statusCode < 600) {
    return error.statusCode;
  }
  if (error.name === "ValidationError" || error.name === "CastError") {
    return 400;
  }
  return 500;
}

function applyScopeToDoc(doc, scope, roomType) {
  if (scope === "hotel") {
    doc.roomType = undefined;
  } else if (scope === "room_type") {
    doc.roomType = roomType;
  }
}

/**
 * GET /api/owner/sales?hotelId=
 */
exports.listSales = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) {
      return res.status(400).json({ message: "Vui lòng cung cấp hotelId" });
    }
    await assertOwnerHotel(req.user.id, hotelId);

    const ymdToday = vnDateKey();
    const list = await SalePromotion.find({ hotelId })
      .sort({ startDate: -1, createdAt: -1 })
      .lean();

    res.json(list.map((s) => enrichSaleForOwner(s, ymdToday)));
  } catch (error) {
    console.error("listSales:", error);
    res.status(statusFromError(error)).json({ message: error.message || "Lỗi tải chương trình sale" });
  }
};

/**
 * POST /api/owner/sales
 */
exports.createSale = async (req, res) => {
  try {
    const payload = parseSalePayload(req.body);
    const errMsg = validateSalePayload(payload);
    if (errMsg) return res.status(400).json({ message: errMsg });

    await assertOwnerHotel(req.user.id, payload.hotelId);

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
    res.status(201).json(enrichSaleForOwner(sale.toObject(), ymdToday));
  } catch (error) {
    console.error("createSale:", error);
    res.status(statusFromError(error)).json({ message: error.message || "Lỗi tạo chương trình sale" });
  }
};

/**
 * PUT /api/owner/sales/:id
 */
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const existing = await SalePromotion.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Không tìm thấy chương trình sale" });
    }
    await assertOwnerHotel(req.user.id, existing.hotelId);

    const payload = parseSalePayload(req.body, { partial: true });

    const isActiveErr = normalizePayloadIsActive(payload);
    if (isActiveErr) return res.status(400).json({ message: isActiveErr });

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
    if (errMsg) return res.status(400).json({ message: errMsg });

    const ymdToday = vnDateKey();

    if (payload.title !== undefined) existing.title = payload.title;
    if (payload.scope != null) existing.scope = payload.scope;
    if (payload.roomType !== undefined) existing.roomType = payload.roomType;
    if (payload.startDate != null) existing.startDate = payload.startDate;
    if (payload.endDate != null) existing.endDate = payload.endDate;
    if (payload.discountPercent != null) existing.discountPercent = payload.discountPercent;

    if (payload.isActive !== undefined) {
      if (payload.isActive === true && existing.endDate < ymdToday) {
        return res.status(400).json({
          message: "Chương trình đã hết hạn, không thể mở lại. Hãy kéo dài ngày kết thúc lưu trú.",
        });
      }
      existing.isActive = payload.isActive;
    }

    applyScopeToDoc(existing, existing.scope, existing.roomType);
    if (existing.scope === "room_type" && !existing.roomType) {
      return res.status(400).json({ message: "Cần loại phòng" });
    }

    if (existing.endDate < existing.startDate) {
      return res.status(400).json({ message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu" });
    }

    existing.isActive = resolveIsActiveOnSave(existing.endDate, existing.isActive, ymdToday);
    await existing.save();
    res.json(enrichSaleForOwner(existing.toObject(), ymdToday));
  } catch (error) {
    console.error("updateSale:", error);
    res.status(statusFromError(error)).json({ message: error.message || "Lỗi cập nhật" });
  }
};

/**
 * PATCH /api/owner/sales/:id/status  Body: { isActive: boolean }
 */
exports.setSaleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedActive = parseRequiredBoolean(req.body?.isActive);
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    if (!parsedActive.ok) {
      return res.status(400).json({ message: parsedActive.message });
    }
    const isActive = parsedActive.value;

    const existing = await SalePromotion.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Không tìm thấy chương trình sale" });
    }
    await assertOwnerHotel(req.user.id, existing.hotelId);

    const ymdToday = vnDateKey();
    if (isActive === true && existing.endDate < ymdToday) {
      return res.status(400).json({
        message: "Chương trình đã hết hạn, không thể mở lại. Hãy kéo dài ngày kết thúc lưu trú.",
      });
    }

    existing.isActive = isActive;
    await existing.save();
    res.json(enrichSaleForOwner(existing.toObject(), ymdToday));
  } catch (error) {
    console.error("setSaleStatus:", error);
    res.status(statusFromError(error)).json({ message: error.message || "Lỗi cập nhật trạng thái" });
  }
};

/**
 * POST /api/owner/sales/sync-expired?hotelId=
 */
exports.syncExpiredSales = async (req, res) => {
  try {
    const { hotelId } = req.query;
    if (!hotelId) {
      return res.status(400).json({ message: "Vui lòng cung cấp hotelId" });
    }
    await assertOwnerHotel(req.user.id, hotelId);
    const modifiedCount = await deactivateExpiredSalesForHotelIds([hotelId]);
    res.json({ ok: true, modifiedCount });
  } catch (error) {
    console.error("syncExpiredSales:", error);
    res.status(statusFromError(error)).json({ message: error.message || "Lỗi đồng bộ sale hết hạn" });
  }
};

/** DELETE /api/owner/sales/:id — đóng chương trình (isActive: false) */
exports.deactivateSale = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }
    const existing = await SalePromotion.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Không tìm thấy chương trình sale" });
    }
    await assertOwnerHotel(req.user.id, existing.hotelId);
    existing.isActive = false;
    await existing.save();
    res.json({ ok: true, sale: enrichSaleForOwner(existing.toObject(), vnDateKey()) });
  } catch (error) {
    console.error("deactivateSale:", error);
    res.status(statusFromError(error)).json({ message: error.message || "Lỗi đóng chương trình" });
  }
};
