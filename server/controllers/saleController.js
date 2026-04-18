const mongoose = require("mongoose");
const SalePromotion = require("../models/SalePromotion");
const Hotel = require("../models/Hotel");

/** Lỗi có HTTP status — tránh suy luận status từ chuỗi message */
function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Khách sạn tồn tại, đúng owner — dùng trước thao tác sale theo hotelId.
 * 400: hotelId không phải ObjectId
 * 404: không có khách sạn
 * 403: khách sạn thuộc người khác
 */
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
    const list = await SalePromotion.find({ hotelId })
      .sort({ startDate: -1, createdAt: -1 })
      .lean();
    res.json(list);
  } catch (error) {
    console.error("listSales:", error);
    const msg = error.message || "Lỗi tải chương trình sale";
    res.status(statusFromError(error)).json({ message: msg });
  }
};

/**
 * POST /api/owner/sales
 * Body: { hotelId, title, scope, roomType?, startDate, endDate, discountPercent, isActive? }
 */
exports.createSale = async (req, res) => {
  try {
    const { hotelId, title, scope, roomType, startDate, endDate, discountPercent, isActive } =
      req.body || {};

    const titleTrimmed = title != null ? String(title).trim() : "";
    const discountMissing =
      discountPercent === undefined || discountPercent === null || discountPercent === "";

    if (!hotelId || !scope || !startDate || !endDate || discountMissing) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }
    if (!titleTrimmed) {
      return res.status(400).json({ message: "Tên chương trình không được để trống" });
    }

    const pct = Number(discountPercent);
    if (!Number.isFinite(pct)) {
      return res.status(400).json({ message: "Phần trăm giảm giá phải là số hợp lệ" });
    }
    if (pct < 1 || pct > 100) {
      return res.status(400).json({ message: "Phần trăm giảm giá phải từ 1 đến 100" });
    }

    if (endDate < startDate) {
      return res.status(400).json({ message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu" });
    }
    await assertOwnerHotel(req.user.id, hotelId);

    const doc = {
      hotelId,
      title: titleTrimmed,
      scope,
      startDate,
      endDate,
      discountPercent: pct,
      isActive: isActive !== false,
    };
    if (scope === "room_type") {
      if (!roomType) {
        return res.status(400).json({ message: "Cần chọn loại phòng khi phạm vi là loại phòng" });
      }
      doc.roomType = roomType;
    }

    const sale = new SalePromotion(doc);
    await sale.save();
    res.status(201).json(sale);
  } catch (error) {
    console.error("createSale:", error);
    const msg = error.message || "Lỗi tạo chương trình sale";
    res.status(statusFromError(error)).json({ message: msg });
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

    const { title, scope, roomType, startDate, endDate, discountPercent, isActive } = req.body || {};
    if (title != null) existing.title = String(title).trim();
    if (scope != null) existing.scope = scope;
    if (roomType !== undefined) existing.roomType = roomType;
    if (startDate != null) existing.startDate = startDate;
    if (endDate != null) existing.endDate = endDate;
    if (discountPercent != null) existing.discountPercent = Number(discountPercent);
    if (isActive !== undefined) existing.isActive = !!isActive;

    if (existing.scope === "hotel") {
      existing.roomType = undefined;
    } else if (existing.scope === "room_type" && !existing.roomType) {
      return res.status(400).json({ message: "Cần loại phòng" });
    }

    if (existing.endDate < existing.startDate) {
      return res.status(400).json({ message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu" });
    }

    await existing.save();
    res.json(existing);
  } catch (error) {
    console.error("updateSale:", error);
    const msg = error.message || "Lỗi cập nhật";
    res.status(statusFromError(error)).json({ message: msg });
  }
};

/**
 * DELETE /api/owner/sales/:id — vô hiệu hóa (isActive: false)
 */
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
    res.json({ ok: true, sale: existing });
  } catch (error) {
    console.error("deactivateSale:", error);
    const msg = error.message || "Lỗi xóa";
    res.status(statusFromError(error)).json({ message: msg });
  }
};
