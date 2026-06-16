const pricingApi = require("../services/pricing/pricingApiService");
const { runService } = require("../lib/http/controllerHelper");

exports.getDynamicPricing = (req, res) =>
  runService(res, () =>
    pricingApi.getDynamicPricing({
      ownerId: req.user.id,
      hotelId: req.query.hotelId,
      days: req.query.days,
    })
  );

exports.applySuggestedPrices = (req, res) =>
  runService(res, () =>
    pricingApi.applySuggestedPrices({
      ownerId: req.user.id,
      hotelId: req.body?.hotelId,
      roomType: req.body?.roomType,
      days: req.body?.days,
      date: req.body?.date,
    })
  );
