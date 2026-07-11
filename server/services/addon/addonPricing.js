const HotelAddonService = require("../../models/HotelAddonService");

function countStayNights(checkInDate, checkOutDate) {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, nights);
}

function computeAddonLineTotal(service, nights, guestCount) {
  const price = Number(service.price) || 0;
  const guests = Math.max(1, Number(guestCount) || 1);

  switch (service.pricingUnit) {
    case "per_night":
      return price * nights;
    case "per_person_per_night":
      return price * nights * guests;
    case "per_person_per_stay":
      return price * guests;
    case "per_stay":
    default:
      return price;
  }
}

function buildSelectedAddonSnapshot(service, nights, guestCount) {
  const lineTotal = computeAddonLineTotal(service, nights, guestCount);
  return {
    service: service._id,
    name: service.name,
    price: service.price,
    pricingUnit: service.pricingUnit,
    category: service.category,
    quantity: 1,
    lineTotal,
  };
}

async function resolveAndPriceAddons({
  hotelId,
  selectedAddonIds = [],
  checkInDate,
  checkOutDate,
  guestCount,
}) {
  if (!Array.isArray(selectedAddonIds) || selectedAddonIds.length === 0) {
    return { selectedAddons: [], addonsAmount: 0 };
  }

  const uniqueIds = [...new Set(selectedAddonIds.map(String))];
  const services = await HotelAddonService.find({
    _id: { $in: uniqueIds },
    hotelId,
    isActive: true,
  }).lean();

  if (services.length !== uniqueIds.length) {
    const err = new Error("Một hoặc nhiều dịch vụ đi kèm không hợp lệ hoặc đã ngừng cung cấp");
    err.statusCode = 400;
    throw err;
  }

  const nights = countStayNights(checkInDate, checkOutDate);
  const selectedAddons = services.map((service) =>
    buildSelectedAddonSnapshot(service, nights, guestCount)
  );
  const addonsAmount = selectedAddons.reduce((sum, item) => sum + item.lineTotal, 0);

  return { selectedAddons, addonsAmount };
}

module.exports = {
  countStayNights,
  computeAddonLineTotal,
  buildSelectedAddonSnapshot,
  resolveAndPriceAddons,
};
