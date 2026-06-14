const reportApi = require("../services/reports/reportApiService");
const { runService } = require("../lib/http/controllerHelper");

exports.exportOwnerReport = (req, res) =>
  runService(res, () =>
    reportApi.exportOwnerReport({
      ownerId: req.user.id,
      from: req.query.from,
      to: req.query.to,
      hotelId: req.query.hotelId,
    })
  );

exports.exportAdminReport = (req, res) =>
  runService(res, () =>
    reportApi.exportAdminReport({
      from: req.query.from,
      to: req.query.to,
      hotelId: req.query.hotelId,
    })
  );
