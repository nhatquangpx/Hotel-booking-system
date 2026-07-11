const addonService = require("../services/addon/addonManagementService");
const { runService } = require("../lib/http/controllerHelper");
const { parseRequiredBoolean } = require("../lib/http/parseBoolean");
const { ServiceError } = require("../lib/http/serviceError");

exports.listGuestHotelAddons = (req, res) =>
  runService(res, async () => {
    const body = await addonService.listAddonsForHotel({
      hotelId: req.params.hotelId,
      activeOnly: true,
    });
    return { status: 200, body };
  });

exports.listOwnerAddons = (req, res) =>
  runService(res, () =>
    addonService.listAddonsForOwner({
      ownerId: req.user.id,
      hotelId: req.query.hotelId,
      page: req.query.page,
      limit: req.query.limit,
      all: req.query.all,
    })
  );

exports.createOwnerAddon = (req, res) =>
  runService(res, () => addonService.createAddon({ ownerId: req.user.id, body: req.body }));

exports.updateOwnerAddon = (req, res) =>
  runService(res, () =>
    addonService.updateAddon({ ownerId: req.user.id, id: req.params.id, body: req.body })
  );

exports.setOwnerAddonStatus = (req, res) =>
  runService(res, async () => {
    const parsed = parseRequiredBoolean(req.body?.isActive);
    if (!parsed.ok) throw new ServiceError(400, parsed.message);
    return addonService.setAddonStatus({
      ownerId: req.user.id,
      id: req.params.id,
      isActive: parsed.value,
    });
  });

exports.listStaffAddons = (req, res) =>
  runService(res, () =>
    addonService.listAddonsForStaff({
      staffId: req.user.id,
      hotelId: req.query.hotelId || req.staffHotelId,
      page: req.query.page,
      limit: req.query.limit,
      all: req.query.all,
    })
  );

exports.createStaffAddon = (req, res) =>
  runService(res, () =>
    addonService.createAddonForStaff({
      staffId: req.user.id,
      body: { ...req.body, hotelId: req.body.hotelId || req.staffHotelId },
    })
  );

exports.updateStaffAddon = (req, res) =>
  runService(res, () =>
    addonService.updateAddonForStaff({ staffId: req.user.id, id: req.params.id, body: req.body })
  );

exports.setStaffAddonStatus = (req, res) =>
  runService(res, async () => {
    const parsed = parseRequiredBoolean(req.body?.isActive);
    if (!parsed.ok) throw new ServiceError(400, parsed.message);
    return addonService.setAddonStatusForStaff({
      staffId: req.user.id,
      id: req.params.id,
      isActive: parsed.value,
    });
  });
