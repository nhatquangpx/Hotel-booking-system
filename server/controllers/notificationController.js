const inboxApiService = require("../services/notifications/inboxApiService");
const { runService } = require("../lib/http/controllerHelper");

exports.getNotifications = (req, res) =>
  runService(res, () =>
    inboxApiService.getNotifications({
      req,
      page: req.query.page,
      limit: req.query.limit,
    })
  );

exports.getUnreadCount = (req, res) =>
  runService(res, () => inboxApiService.getUnreadCount({ req }));

exports.markAsRead = (req, res) =>
  runService(res, () => inboxApiService.markAsRead({ req, id: req.params.id }));

exports.markAllAsRead = (req, res) =>
  runService(res, () => inboxApiService.markAllAsRead({ req }));

exports.loadMoreNotifications = (req, res) =>
  runService(res, () =>
    inboxApiService.loadMoreNotifications({
      req,
      page: req.query.page,
      limit: req.query.limit,
    })
  );

exports.checkNoShowBookings = (req, res) =>
  runService(res, () => inboxApiService.runNoShowCheck({ userRole: req.user.role }));
