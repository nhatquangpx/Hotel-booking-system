const mongoose = require("mongoose");
const Hotel = require("../../models/Hotel");
const Room = require("../../models/Room");
const User = require("../../models/User");
const { isVnpayConfigComplete } = require("./paymentConfig");
const { isGuestBookableHotelStatus } = require("../../services/hotels/status");
const { notifyHotelStatusChanged } = require("../notifications/owner");
const { ServiceError } = require("../../lib/http/serviceError");
const {
  isQrConfigComplete,
  resolvePoliciesRefundMinDaysBeforeCheckIn,
  resolveQrTextFields,
  resolveVnpayFields,
  sanitizeHotelPaymentConfigResponse,
  applyGuestHotelPayloadSanitize,
  MAINTENANCE_CONTACT_EMAIL_REGEX,
  getHotelImageFiles,
  getQrUploadFile,
  resolveHotelUploadedImageUrl,
  isGuestHotelByIdRequest,
  shouldExposePaymentConfig,
} = require("./helpers");
const {
  parsePaginationQuery,
  buildPaginationMeta,
  escapeRegex,
  paginatedBody,
} = require("../../lib/http/pagination");

function mapGuestHotels(req, hotels) {
  return hotels.map((h) =>
    applyGuestHotelPayloadSanitize(req, h.toObject ? h.toObject() : { ...h })
  );
}

function buildAdminHotelListQuery({ searchName, searchAddress, searchPhone, city, starRating }) {
  const query = {};
  if (city) query["address.city"] = { $regex: escapeRegex(city), $options: "i" };
  if (starRating) query.starRating = starRating;

  const name = String(searchName || "").trim();
  const address = String(searchAddress || "").trim();
  const phone = String(searchPhone || "").trim();

  if (name) query.name = { $regex: escapeRegex(name), $options: "i" };
  if (phone) query["contactInfo.phone"] = { $regex: escapeRegex(phone), $options: "i" };
  if (address) {
    query.$or = [
      { "address.street": { $regex: escapeRegex(address), $options: "i" } },
      { "address.city": { $regex: escapeRegex(address), $options: "i" } },
      { "address.number": { $regex: escapeRegex(address), $options: "i" } },
    ];
  }

  return query;
}

async function getGuestHotelCities() {
  const cities = await Hotel.distinct("address.city", {
    status: "active",
    "address.city": { $nin: [null, ""] },
  });
  return {
    status: 200,
    body: cities.filter(Boolean).sort((a, b) => a.localeCompare(b, "vi")),
  };
}

async function getAllHotels({
  req,
  city,
  starRating,
  page,
  limit,
  all,
  searchName,
  searchAddress,
  searchPhone,
}) {
  const isGuest = req.baseUrl === "/api/guest";
  const query = isGuest
    ? (() => {
        const q = {};
        if (city) q["address.city"] = { $regex: escapeRegex(city), $options: "i" };
        if (starRating) q.starRating = starRating;
        return q;
      })()
    : buildAdminHotelListQuery({ searchName, searchAddress, searchPhone, city, starRating });

  const pag = parsePaginationQuery(
    { page, limit, all },
    { defaultLimit: isGuest ? 12 : 10, maxLimit: 100 }
  );

  const baseQuery = Hotel.find(query)
    .populate({ path: "ownerId", select: "name email phone _id" })
    .sort({ createdAt: -1 });

  if (pag.all) {
    const hotels = await baseQuery;
    const body = isGuest ? mapGuestHotels(req, hotels) : hotels;
    return { status: 200, body };
  }

  const [hotels, total] = await Promise.all([
    baseQuery.skip(pag.skip).limit(pag.limit),
    Hotel.countDocuments(query),
  ]);

  const items = isGuest ? mapGuestHotels(req, hotels) : hotels;
  return {
    status: 200,
    body: paginatedBody(items, buildPaginationMeta({ page: pag.page, limit: pag.limit, total }), "hotels"),
  };
}

async function getHotelById({ req, id }) {
  let q = Hotel.findById(id);
  if (shouldExposePaymentConfig(req)) {
    q = q.select(Hotel.PAYMENT_CONFIG_SELECT);
  }
  q = q.populate({ path: "ownerId", select: "name email phone _id" });
  const hotel = await q;

  if (!hotel) throw new ServiceError(404, "Không tìm thấy khách sạn");

  const attachGuestBookableFlag = (payload) => {
    if (req.baseUrl !== "/api/guest") return payload;
    return { ...payload, guestBookable: isGuestBookableHotelStatus(hotel.status) };
  };

  if (shouldExposePaymentConfig(req)) {
    const guestBookingQr = isGuestHotelByIdRequest(req) && req.query.forBooking === "true";
    const body = applyGuestHotelPayloadSanitize(
      req,
      sanitizeHotelPaymentConfigResponse(hotel, { guestBookingQr })
    );
    return { status: 200, body: attachGuestBookableFlag(body) };
  }

  const plainHotel = hotel.toObject ? hotel.toObject() : { ...hotel };
  return {
    status: 200,
    body: attachGuestBookableFlag(applyGuestHotelPayloadSanitize(req, plainHotel)),
  };
}

async function getHotelsByOwner({ ownerId }) {
  const hotels = await Hotel.find({ ownerId }).select(Hotel.PAYMENT_CONFIG_SELECT);
  return {
    status: 200,
    body: hotels.map((h) => sanitizeHotelPaymentConfigResponse(h)),
  };
}

function buildCreateDataFromBody(body) {
  const createData = {};
  if (body.name) createData.name = body.name;
  if (body.description) createData.description = body.description;
  if (body.starRating) createData.starRating = parseInt(body.starRating);
  if (body.status) createData.status = body.status;
  if (body.ownerId) createData.ownerId = body.ownerId;

  if (body["address[number]"] || body["address[street]"] || body["address[city]"]) {
    createData.address = {
      number: body["address[number]"] || body.address?.number || "",
      street: body["address[street]"] || body.address?.street || "",
      city: body["address[city]"] || body.address?.city || "",
    };
  } else if (body.address && typeof body.address === "object") {
    createData.address = body.address;
  }

  if (body["contactInfo[phone]"] || body["contactInfo[email]"]) {
    createData.contactInfo = {
      phone: body["contactInfo[phone]"] || body.contactInfo?.phone || "",
      email: body["contactInfo[email]"] || body.contactInfo?.email || "",
    };
  } else if (body.contactInfo && typeof body.contactInfo === "object") {
    createData.contactInfo = body.contactInfo;
  }

  if (
    body["policies[checkInTime]"] ||
    body["policies[checkOutTime]"] ||
    body["policies[refundMinDaysBeforeCheckIn]"] !== undefined
  ) {
    createData.policies = {
      checkInTime: body["policies[checkInTime]"] || body.policies?.checkInTime || "14:00",
      checkOutTime: body["policies[checkOutTime]"] || body.policies?.checkOutTime || "12:00",
      refundMinDaysBeforeCheckIn: resolvePoliciesRefundMinDaysBeforeCheckIn(body, undefined),
    };
  } else if (body.policies && typeof body.policies === "object") {
    createData.policies = {
      ...body.policies,
      checkInTime: body.policies.checkInTime || "14:00",
      checkOutTime: body.policies.checkOutTime || "12:00",
      refundMinDaysBeforeCheckIn: resolvePoliciesRefundMinDaysBeforeCheckIn(body, undefined),
    };
  }

  return createData;
}

function buildPaymentConfigForCreate(body, qrFile) {
  const qrText = resolveQrTextFields(body, {});
  const qrImageUrl = qrFile ? resolveHotelUploadedImageUrl(qrFile) : "";
  const qrPayload = {
    accountName: qrText.accountName || "",
    accountNumber: qrText.accountNumber || "",
    bankName: qrText.bankName || "",
    qrImageUrl,
  };
  if (!isQrConfigComplete(qrPayload)) {
    throw new ServiceError(
      400,
      "Thiếu thông tin thanh toán QR: vui lòng cung cấp tên chủ TK, số TK, ngân hàng và ảnh QR."
    );
  }

  const paymentConfigPayload = { qr: qrPayload };
  const vnpayText = resolveVnpayFields(body, {});
  const hasVnpayInput =
    vnpayText.tmnCode !== undefined || vnpayText.secureSecret !== undefined;

  if (hasVnpayInput) {
    const vnpayPayload = {
      tmnCode: vnpayText.tmnCode || "",
      secureSecret: vnpayText.secureSecret || "",
    };
    const isEmptyVnpay =
      !String(vnpayPayload.tmnCode).trim() && !String(vnpayPayload.secureSecret).trim();
    if (!isEmptyVnpay && !isVnpayConfigComplete(vnpayPayload)) {
      throw new ServiceError(
        400,
        "Cấu hình VNPay chưa đầy đủ: vui lòng cung cấp cả TMN Code và Secure Secret, hoặc để trống cả hai."
      );
    }
    if (!isEmptyVnpay) paymentConfigPayload.vnpay = vnpayPayload;
  }

  return paymentConfigPayload;
}

async function createHotel({ req }) {
  const imageFiles = getHotelImageFiles(req);
  const images = imageFiles.map(resolveHotelUploadedImageUrl);
  const qrFile = getQrUploadFile(req);
  const createData = buildCreateDataFromBody(req.body);

  const newHotel = new Hotel({ ...createData, images });
  newHotel.paymentConfig = buildPaymentConfigForCreate(req.body, qrFile);

  const savedHotel = await newHotel.save();
  console.log(
    `Đã tạo khách sạn thành công: ${savedHotel._id} (${savedHotel.name}) bởi owner ${savedHotel.ownerId}`
  );

  return { status: 201, body: sanitizeHotelPaymentConfigResponse(savedHotel) };
}

function mergeQrPaymentConfig(body, existingHotel, qrFile) {
  const hasPaymentQrBracket =
    body["paymentConfig[qr][accountName]"] !== undefined ||
    body["paymentConfig[qr][accountNumber]"] !== undefined ||
    body["paymentConfig[qr][bankName]"] !== undefined;
  const hasPaymentQrObject =
    body.paymentConfig?.qr && typeof body.paymentConfig.qr === "object";

  if (!hasPaymentQrBracket && !hasPaymentQrObject && !qrFile) return null;

  const prev = existingHotel.paymentConfig?.qr || {};
  const uploadedUrl = qrFile ? resolveHotelUploadedImageUrl(qrFile) : "";
  const qr = body.paymentConfig?.qr || {};
  const fromBody =
    qr.qrImageUrl != null && String(qr.qrImageUrl).trim() !== ""
      ? String(qr.qrImageUrl).trim()
      : "";
  const qrImageUrl = uploadedUrl || fromBody || prev.qrImageUrl || "";
  const qrText = resolveQrTextFields(body, prev);
  const qrPayload = {
    accountName: qrText.accountName ?? "",
    accountNumber: qrText.accountNumber ?? "",
    bankName: qrText.bankName ?? "",
    qrImageUrl,
  };

  if (!isQrConfigComplete(qrPayload)) {
    throw new ServiceError(
      400,
      "Thiếu thông tin thanh toán QR: vui lòng cung cấp tên chủ TK, số TK, ngân hàng và ảnh QR."
    );
  }
  return qrPayload;
}

function mergeVnpayPaymentConfig(body, existingHotel) {
  const hasPaymentVnpayBracket =
    body["paymentConfig[vnpay][tmnCode]"] !== undefined ||
    body["paymentConfig[vnpay][secureSecret]"] !== undefined;
  const hasPaymentVnpayObject =
    body.paymentConfig?.vnpay && typeof body.paymentConfig.vnpay === "object";

  if (!hasPaymentVnpayBracket && !hasPaymentVnpayObject) return undefined;

  const prevVnpay = existingHotel.paymentConfig?.vnpay || {};
  const vnpayText = resolveVnpayFields(body, prevVnpay);
  const trimmedTmn = String(vnpayText.tmnCode || "").trim();
  const prevSecretTrimmed = String(prevVnpay?.secureSecret || "").trim();
  const hasSecretFieldInBody =
    body["paymentConfig[vnpay][secureSecret]"] !== undefined ||
    (body.paymentConfig?.vnpay &&
      Object.prototype.hasOwnProperty.call(body.paymentConfig.vnpay, "secureSecret"));
  const incomingSecretTrimmed = hasSecretFieldInBody
    ? String(
        body["paymentConfig[vnpay][secureSecret]"] !== undefined
          ? body["paymentConfig[vnpay][secureSecret]"]
          : (body.paymentConfig.vnpay.secureSecret ?? "")
      ).trim()
    : null;
  const keepPrevSecret = Boolean(trimmedTmn && prevSecretTrimmed);
  let nextSecret;
  if (incomingSecretTrimmed !== null && incomingSecretTrimmed !== "") {
    nextSecret = incomingSecretTrimmed;
  } else {
    nextSecret = keepPrevSecret ? prevVnpay.secureSecret : "";
  }

  const vnpayPayload = { tmnCode: vnpayText.tmnCode || "", secureSecret: nextSecret };
  const isEmptyVnpay =
    !String(vnpayPayload.tmnCode).trim() && !String(vnpayPayload.secureSecret).trim();

  if (!isEmptyVnpay && !isVnpayConfigComplete(vnpayPayload)) {
    throw new ServiceError(
      400,
      "Cấu hình VNPay chưa đầy đủ: vui lòng cung cấp cả TMN Code và Secure Secret, hoặc để trống cả hai."
    );
  }

  return isEmptyVnpay ? null : vnpayPayload;
}

async function updateHotel({ req, id }) {
  const existingHotel = await Hotel.findById(id).select(
    "images status policies " + Hotel.PAYMENT_CONFIG_SELECT
  );
  if (!existingHotel) throw new ServiceError(404, "Không tìm thấy khách sạn");

  const qrFile = getQrUploadFile(req);
  const updateData = {};

  if (req.body.name) updateData.name = req.body.name;
  if (req.body.description) updateData.description = req.body.description;
  if (req.body.starRating) updateData.starRating = parseInt(req.body.starRating);
  if (req.body.status && req.user?.role === "admin") updateData.status = req.body.status;

  if (req.body.ownerId && req.user?.role === "admin") {
    const nextOwner = await User.findOne({ _id: req.body.ownerId, role: "owner" }).select("_id");
    if (!nextOwner) throw new ServiceError(400, "Owner không hợp lệ");
    updateData.ownerId = req.body.ownerId;
  }

  if (req.body["address[number]"] || req.body["address[street]"] || req.body["address[city]"]) {
    updateData.address = {
      number: req.body["address[number]"] || req.body.address?.number || "",
      street: req.body["address[street]"] || req.body.address?.street || "",
      city: req.body["address[city]"] || req.body.address?.city || "",
    };
  } else if (req.body.address && typeof req.body.address === "object") {
    updateData.address = req.body.address;
  }

  if (req.body["contactInfo[phone]"] || req.body["contactInfo[email]"]) {
    updateData.contactInfo = {
      phone: req.body["contactInfo[phone]"] || req.body.contactInfo?.phone || "",
      email: req.body["contactInfo[email]"] || req.body.contactInfo?.email || "",
    };
  } else if (req.body.contactInfo && typeof req.body.contactInfo === "object") {
    updateData.contactInfo = req.body.contactInfo;
  }

  const prevPolicies = existingHotel.policies || {};
  if (
    req.body["policies[checkInTime]"] ||
    req.body["policies[checkOutTime]"] ||
    req.body["policies[refundMinDaysBeforeCheckIn]"] !== undefined
  ) {
    updateData.policies = {
      checkInTime:
        req.body["policies[checkInTime]"] ||
        req.body.policies?.checkInTime ||
        prevPolicies.checkInTime ||
        "14:00",
      checkOutTime:
        req.body["policies[checkOutTime]"] ||
        req.body.policies?.checkOutTime ||
        prevPolicies.checkOutTime ||
        "12:00",
      refundMinDaysBeforeCheckIn: resolvePoliciesRefundMinDaysBeforeCheckIn(
        req.body,
        prevPolicies.refundMinDaysBeforeCheckIn
      ),
    };
  } else if (req.body.policies && typeof req.body.policies === "object") {
    updateData.policies = {
      ...req.body.policies,
      checkInTime: req.body.policies.checkInTime || prevPolicies.checkInTime || "14:00",
      checkOutTime: req.body.policies.checkOutTime || prevPolicies.checkOutTime || "12:00",
      refundMinDaysBeforeCheckIn: resolvePoliciesRefundMinDaysBeforeCheckIn(
        req.body,
        prevPolicies.refundMinDaysBeforeCheckIn
      ),
    };
  }

  const nextPaymentConfig = { ...(existingHotel.paymentConfig || {}) };
  let shouldUpdatePaymentConfig = false;

  const qrPayload = mergeQrPaymentConfig(req.body, existingHotel, qrFile);
  if (qrPayload) {
    nextPaymentConfig.qr = qrPayload;
    shouldUpdatePaymentConfig = true;
  }

  const vnpayResult = mergeVnpayPaymentConfig(req.body, existingHotel);
  if (vnpayResult !== undefined) {
    if (vnpayResult === null) delete nextPaymentConfig.vnpay;
    else nextPaymentConfig.vnpay = vnpayResult;
    shouldUpdatePaymentConfig = true;
  }

  if (shouldUpdatePaymentConfig) {
    const normalizedPaymentConfig = {};
    if (nextPaymentConfig.qr) normalizedPaymentConfig.qr = nextPaymentConfig.qr;
    if (nextPaymentConfig.vnpay) normalizedPaymentConfig.vnpay = nextPaymentConfig.vnpay;
    updateData.paymentConfig = normalizedPaymentConfig;
  }

  let existingImages = [];
  if (req.body.existingImages) {
    try {
      existingImages = JSON.parse(req.body.existingImages);
    } catch {
      existingImages = [];
    }
  }

  const imageFiles = getHotelImageFiles(req);
  const newImages = imageFiles.map(resolveHotelUploadedImageUrl);
  if (existingImages.length > 0 || newImages.length > 0) {
    updateData.images = [...existingImages, ...newImages];
  }

  const previousStatus = existingHotel.status || "active";
  const updatedHotel = await Hotel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select(Hotel.PAYMENT_CONFIG_SELECT);

  console.log(`Đã cập nhật khách sạn thành công: ${id} (${updatedHotel?.name})`);

  if (updateData.status && updateData.status !== previousStatus && req.user?.role === "admin") {
    await notifyHotelStatusChanged(updatedHotel._id, previousStatus, updateData.status);
  }

  return { status: 200, body: sanitizeHotelPaymentConfigResponse(updatedHotel) };
}

async function deleteHotel({ id }) {
  const deletedHotel = await Hotel.findByIdAndDelete(id);
  if (deletedHotel) {
    console.log(`Đã xóa khách sạn thành công: ${id} (${deletedHotel.name})`);
  }
  return { status: 200, body: { message: "Đã xóa khách sạn thành công" } };
}

async function getAllOwners({ userRole }) {
  if (userRole !== "admin") {
    throw new ServiceError(403, "Chỉ Admin mới có quyền xem danh sách owners");
  }
  const owners = await User.find({ role: "owner" }).select("name email phone _id");
  console.log(`Tìm thấy ${owners.length} owners`);
  return { status: 200, body: owners };
}

async function getFeaturedHotels({ req }) {
  const featuredHotels = await Hotel.find({ starRating: 5, status: "active" })
    .populate({ path: "ownerId", select: "name email phone _id" })
    .limit(6);

  return {
    status: 200,
    body: featuredHotels.map((h) =>
      applyGuestHotelPayloadSanitize(req, h.toObject ? h.toObject() : { ...h })
    ),
  };
}

async function getHotelByFilter({ req, filters }) {
  const {
    city,
    starRating,
    name,
    search,
    minPrice,
    maxPrice,
    maxPeople,
    roomType,
    amenities,
    page,
    limit,
    all,
  } = filters;

  const hotelQuery = { status: "active" };
  if (city) hotelQuery["address.city"] = { $regex: escapeRegex(city), $options: "i" };
  if (starRating) hotelQuery.starRating = parseInt(starRating, 10);
  if (name) hotelQuery.name = { $regex: escapeRegex(name), $options: "i" };
  if (search) {
    hotelQuery.$or = [
      { name: { $regex: escapeRegex(search), $options: "i" } },
      { "address.city": { $regex: escapeRegex(search), $options: "i" } },
    ];
  }

  const hasRoomFilters = minPrice || maxPrice || maxPeople || roomType || amenities;
  if (hasRoomFilters) {
    const roomQuery = { roomStatus: "active" };
    if (minPrice || maxPrice) {
      const priceCond = {};
      if (minPrice) priceCond.$gte = parseInt(minPrice, 10);
      if (maxPrice) priceCond.$lte = parseInt(maxPrice, 10);
      roomQuery.price = priceCond;
    }
    if (maxPeople) roomQuery.maxPeople = { $gte: parseInt(maxPeople, 10) };
    if (roomType) {
      const roomTypes = Array.isArray(roomType) ? roomType : [roomType];
      roomQuery.type = { $in: roomTypes };
    }
    if (amenities) {
      let facilitiesArray;
      if (Array.isArray(amenities)) facilitiesArray = amenities;
      else if (typeof amenities === "string") {
        facilitiesArray = amenities.split(",").filter((a) => a.trim() !== "");
      } else facilitiesArray = [amenities];

      if (facilitiesArray.length > 0) {
        roomQuery.facilities = { $all: facilitiesArray };
      }
    }

    const matchingRooms = await Room.find(roomQuery).select("hotelId");
    const hotelIds = [...new Set(matchingRooms.map((room) => room.hotelId.toString()))];
    if (hotelIds.length > 0) {
      hotelQuery._id = { $in: hotelIds.map((hid) => new mongoose.Types.ObjectId(hid)) };
    } else {
      const pag = parsePaginationQuery({ page, limit, all }, { defaultLimit: 12, maxLimit: 100 });
      if (pag.all) return { status: 200, body: [] };
      return {
        status: 200,
        body: paginatedBody([], buildPaginationMeta({ page: pag.page, limit: pag.limit, total: 0 }), "hotels"),
      };
    }
  }

  const pag = parsePaginationQuery({ page, limit, all }, { defaultLimit: 12, maxLimit: 100 });
  const baseQuery = Hotel.find(hotelQuery)
    .populate({ path: "ownerId", select: "name email phone _id" })
    .sort({ createdAt: -1 });

  if (pag.all) {
    const hotels = await baseQuery;
    return { status: 200, body: mapGuestHotels(req, hotels) };
  }

  const [hotels, total] = await Promise.all([
    baseQuery.skip(pag.skip).limit(pag.limit),
    Hotel.countDocuments(hotelQuery),
  ]);

  return {
    status: 200,
    body: paginatedBody(
      mapGuestHotels(req, hotels),
      buildPaginationMeta({ page: pag.page, limit: pag.limit, total }),
      "hotels"
    ),
  };
}

async function getOwnerHotelMaintenanceContact({ hotelId, ownerId }) {
  if (!mongoose.isValidObjectId(hotelId)) {
    throw new ServiceError(400, "hotelId không hợp lệ");
  }
  const hotel = await Hotel.findOne({ _id: hotelId, ownerId }).select("maintenanceContactEmail");
  if (!hotel) {
    throw new ServiceError(404, "Không tìm thấy khách sạn hoặc bạn không có quyền truy cập");
  }
  return {
    status: 200,
    body: { maintenanceContactEmail: String(hotel.maintenanceContactEmail || "").trim() },
  };
}

async function updateOwnerHotelMaintenanceContact({ hotelId, ownerId, maintenanceContactEmail }) {
  if (!mongoose.isValidObjectId(hotelId)) {
    throw new ServiceError(400, "hotelId không hợp lệ");
  }
  const trimmed = typeof maintenanceContactEmail === "string" ? maintenanceContactEmail.trim() : "";
  if (trimmed && !MAINTENANCE_CONTACT_EMAIL_REGEX.test(trimmed)) {
    throw new ServiceError(400, "Địa chỉ email không hợp lệ");
  }
  const hotel = await Hotel.findOne({ _id: hotelId, ownerId });
  if (!hotel) {
    throw new ServiceError(404, "Không tìm thấy khách sạn hoặc bạn không có quyền truy cập");
  }
  hotel.maintenanceContactEmail = trimmed;
  await hotel.save();
  return {
    status: 200,
    body: { maintenanceContactEmail: String(hotel.maintenanceContactEmail || "").trim() },
  };
}

async function getStaffHotelMaintenanceContact({ hotel }) {
  if (!hotel) {
    throw new ServiceError(403, "Tài khoản nhân viên chưa được gán khách sạn");
  }
  return {
    status: 200,
    body: { maintenanceContactEmail: String(hotel.maintenanceContactEmail || "").trim() },
  };
}

module.exports = {
  getAllHotels,
  getGuestHotelCities,
  getHotelById,
  getHotelsByOwner,
  createHotel,
  updateHotel,
  deleteHotel,
  getAllOwners,
  getFeaturedHotels,
  getHotelByFilter,
  getOwnerHotelMaintenanceContact,
  updateOwnerHotelMaintenanceContact,
  getStaffHotelMaintenanceContact,
};
