const saleService = require("../services/sale/saleManagementService");
const { runService } = require("../lib/http/controllerHelper");
const { parseRequiredBoolean } = require("../lib/http/parseBoolean");
const { ServiceError } = require("../lib/http/serviceError");

exports.listSales = (req, res) =>
  runService(res, () =>
    saleService.listSales({
      ownerId: req.user.id,
      hotelId: req.query.hotelId,
      page: req.query.page,
      limit: req.query.limit,
      all: req.query.all,
    })
  );

exports.createSale = (req, res) =>
  runService(res, () => saleService.createSale({ ownerId: req.user.id, body: req.body }));

exports.updateSale = (req, res) =>
  runService(res, () =>
    saleService.updateSale({ ownerId: req.user.id, id: req.params.id, body: req.body })
  );

exports.setSaleStatus = (req, res) =>
  runService(res, async () => {
    const parsedActive = parseRequiredBoolean(req.body?.isActive);
    if (!parsedActive.ok) throw new ServiceError(400, parsedActive.message);
    return saleService.setSaleStatus({
      ownerId: req.user.id,
      id: req.params.id,
      isActive: parsedActive.value,
    });
  });

exports.syncExpiredSales = (req, res) =>
  runService(res, () =>
    saleService.syncExpiredSales({ ownerId: req.user.id, hotelId: req.query.hotelId })
  );

exports.deactivateSale = (req, res) =>
  runService(res, () => saleService.deactivateSale({ ownerId: req.user.id, id: req.params.id }));
