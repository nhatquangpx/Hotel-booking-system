const reviewService = require("../services/reviews/reviewService");
const { runService } = require("../lib/http/controllerHelper");

exports.addReview = (req, res) =>
  runService(res, () =>
    reviewService.addReview({
      bookingId: req.params.id,
      userId: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment,
    })
  );

exports.getReviewsByHotel = (req, res) =>
  runService(res, () =>
    reviewService.getReviewsByHotel({
      hotelId: req.params.hotelId,
      page: req.query.page,
      limit: req.query.limit,
      rating: req.query.rating,
    })
  );

exports.getReviewByBooking = (req, res) =>
  runService(res, () => reviewService.getReviewByBooking({ bookingId: req.params.bookingId }));

exports.updateReview = (req, res) =>
  runService(res, () =>
    reviewService.updateReview({
      reviewId: req.params.id,
      userId: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment,
    })
  );

exports.deleteReview = (req, res) =>
  runService(res, () =>
    reviewService.deleteReview({ reviewId: req.params.id, userId: req.user.id })
  );

exports.getReviewsByOwner = (req, res) =>
  runService(res, () =>
    reviewService.getReviewsByOwner({
      ownerId: req.user.id,
      page: req.query.page,
      limit: req.query.limit,
      hotelId: req.query.hotelId,
      rating: req.query.rating,
    })
  );

exports.getStaffReviews = (req, res) =>
  runService(res, () =>
    reviewService.getStaffReviews({
      staffId: req.user.id,
      page: req.query.page,
      limit: req.query.limit,
      rating: req.query.rating,
    })
  );

exports.replyToReview = (req, res) =>
  runService(res, () =>
    reviewService.replyToReview({
      reviewId: req.params.id,
      ownerId: req.user.id,
      response: req.body?.response,
    })
  );

exports.staffReplyToReview = (req, res) =>
  runService(res, () =>
    reviewService.staffReplyToReview({
      reviewId: req.params.id,
      staffId: req.user.id,
      response: req.body?.response,
    })
  );

exports.deleteReply = (req, res) =>
  runService(res, () =>
    reviewService.deleteReply({ reviewId: req.params.id, ownerId: req.user.id })
  );

exports.staffDeleteReply = (req, res) =>
  runService(res, () =>
    reviewService.staffDeleteReply({ reviewId: req.params.id, staffId: req.user.id })
  );
