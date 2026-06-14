const contactService = require("../services/contact/contactService");
const { runService } = require("../lib/http/controllerHelper");

exports.submitContact = (req, res) =>
  runService(res, () => contactService.submitContact(req.body));

exports.getContactMessages = (req, res) =>
  runService(res, () =>
    contactService.getContactMessages({
      page: req.query.page,
      limit: req.query.limit,
      isRead: req.query.isRead,
    })
  );

exports.markContactMessageAsRead = (req, res) =>
  runService(res, () => contactService.markContactMessageAsRead({ id: req.params.id }));

exports.replyContactMessage = (req, res) =>
  runService(res, () =>
    contactService.replyContactMessage({
      id: req.params.id,
      adminUserId: req.user.id,
      replyMessage: req.body?.replyMessage,
    })
  );
