const cancelAbuseService = require("../services/moderation/cancelAbuseService");
const { runService } = require("../lib/http/controllerHelper");

exports.listCancelAbuseFlags = (req, res) =>
  runService(res, () =>
    cancelAbuseService.listFlags({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    })
  );

exports.getCancelAbuseFlag = (req, res) =>
  runService(res, () => cancelAbuseService.getFlagById(req.params.id));

exports.reviewCancelAbuseFlag = (req, res) =>
  runService(res, () =>
    cancelAbuseService.reviewFlag({
      flagId: req.params.id,
      adminId: req.user.id || req.user._id,
      action: req.body.action,
      sanctionDays: req.body.sanctionDays,
      adminNote: req.body.adminNote,
    })
  );
