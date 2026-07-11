const mongoose = require("mongoose");
const HotelAddonService = require("../../models/HotelAddonService");
const Hotel = require("../../models/Hotel");
const { ServiceError } = require("../../lib/http/serviceError");
const {
  parsePaginationQuery,
  buildPaginationMeta,
  paginatedBody,
} = require("../../lib/http/pagination");

async function loadHotelOrThrow(hotelId) {
  if (!mongoose.isValidObjectId(hotelId)) {
    throw new ServiceError(400, "hotelId không hợp lệ");
  }
  const hotel = await Hotel.findById(hotelId).select("ownerId staffIds").lean();
  if (!hotel) throw new ServiceError(404, "Không tìm thấy khách sạn");
  return hotel;
}

async function assertOwnerHotel(ownerId, hotelId) {
  const hotel = await loadHotelOrThrow(hotelId);
  if (String(hotel.ownerId) !== String(ownerId)) {
    throw new ServiceError(403, "Không có quyền truy cập khách sạn này");
  }
  return hotel;
}

async function assertStaffHotel(staffId, hotelId) {
  const hotel = await loadHotelOrThrow(hotelId);
  const staffIds = (hotel.staffIds || []).map(String);
  if (!staffIds.includes(String(staffId))) {
    throw new ServiceError(403, "Bạn không được phân công tại khách sạn này");
  }
  return hotel;
}

async function findAddonOrThrow(id) {
  if (!mongoose.isValidObjectId(id)) throw new ServiceError(400, "ID không hợp lệ");
  const existing = await HotelAddonService.findById(id);
  if (!existing) throw new ServiceError(404, "Không tìm thấy dịch vụ");
  return existing;
}

async function listAddonsForHotel({ hotelId, activeOnly = false }) {
  if (!mongoose.isValidObjectId(hotelId)) {
    throw new ServiceError(400, "hotelId không hợp lệ");
  }
  const query = { hotelId };
  if (activeOnly) query.isActive = true;
  return HotelAddonService.find(query).sort({ category: 1, name: 1 }).lean();
}

async function listAddonsPaginated({ hotelId, page, limit, all }) {
  const pag = parsePaginationQuery({ page, limit, all }, { defaultLimit: 20, maxLimit: 100 });
  const query = { hotelId };

  if (pag.all) {
    const list = await HotelAddonService.find(query).sort({ createdAt: -1 }).lean();
    return { status: 200, body: list };
  }

  const [list, total] = await Promise.all([
    HotelAddonService.find(query).sort({ createdAt: -1 }).skip(pag.skip).limit(pag.limit).lean(),
    HotelAddonService.countDocuments(query),
  ]);

  return {
    status: 200,
    body: paginatedBody(list, buildPaginationMeta({ page: pag.page, limit: pag.limit, total }), "addons"),
  };
}

async function listAddonsForOwner({ ownerId, hotelId, page, limit, all }) {
  await assertOwnerHotel(ownerId, hotelId);
  return listAddonsPaginated({ hotelId, page, limit, all });
}

async function listAddonsForStaff({ staffId, hotelId, page, limit, all }) {
  await assertStaffHotel(staffId, hotelId);
  return listAddonsPaginated({ hotelId, page, limit, all });
}

async function createAddonDocument(body) {
  const addon = await new HotelAddonService({
    hotelId: body.hotelId,
    name: body.name,
    description: body.description || "",
    price: body.price,
    category: body.category || "other",
    pricingUnit: body.pricingUnit || "per_stay",
    isActive: body.isActive !== false,
  }).save();

  return { status: 201, body: addon };
}

async function createAddon({ ownerId, body }) {
  await assertOwnerHotel(ownerId, body.hotelId);
  return createAddonDocument(body);
}

async function createAddonForStaff({ staffId, body }) {
  await assertStaffHotel(staffId, body.hotelId);
  return createAddonDocument(body);
}

function applyAddonUpdates(existing, body) {
  if (body.name !== undefined) existing.name = body.name;
  if (body.description !== undefined) existing.description = body.description;
  if (body.price !== undefined) existing.price = body.price;
  if (body.category !== undefined) existing.category = body.category;
  if (body.pricingUnit !== undefined) existing.pricingUnit = body.pricingUnit;
  if (body.isActive !== undefined) existing.isActive = Boolean(body.isActive);
}

async function updateAddonDocument({ id, body, assertAccess }) {
  const existing = await findAddonOrThrow(id);
  await assertAccess(existing.hotelId);
  applyAddonUpdates(existing, body);
  await existing.save();
  return { status: 200, body: existing };
}

async function updateAddon({ ownerId, id, body }) {
  return updateAddonDocument({
    id,
    body,
    assertAccess: (hotelId) => assertOwnerHotel(ownerId, hotelId),
  });
}

async function updateAddonForStaff({ staffId, id, body }) {
  return updateAddonDocument({
    id,
    body,
    assertAccess: (hotelId) => assertStaffHotel(staffId, hotelId),
  });
}

async function setAddonStatusDocument({ id, isActive, assertAccess }) {
  const existing = await findAddonOrThrow(id);
  await assertAccess(existing.hotelId);
  existing.isActive = Boolean(isActive);
  await existing.save();
  return { status: 200, body: existing };
}

async function setAddonStatus({ ownerId, id, isActive }) {
  return setAddonStatusDocument({
    id,
    isActive,
    assertAccess: (hotelId) => assertOwnerHotel(ownerId, hotelId),
  });
}

async function setAddonStatusForStaff({ staffId, id, isActive }) {
  return setAddonStatusDocument({
    id,
    isActive,
    assertAccess: (hotelId) => assertStaffHotel(staffId, hotelId),
  });
}

module.exports = {
  listAddonsForHotel,
  listAddonsForOwner,
  listAddonsForStaff,
  createAddon,
  createAddonForStaff,
  updateAddon,
  updateAddonForStaff,
  setAddonStatus,
  setAddonStatusForStaff,
};
