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
    reviewService.hotelReviewService
      .getReviewsByOwner(
        req.user.id,
        req.query.page,
        req.query.limit,
        req.query.hotelId || null,
        req.query.rating
      )
      .then((body) => ({ status: 200, body }))
  );

exports.getStaffReviews = (req, res) =>
  runService(res, () =>
    reviewService.hotelReviewService
      .getReviewsByStaff(req.user.id, req.query.page, req.query.limit, req.query.rating)
      .then((body) => ({ status: 200, body }))
  );

exports.replyToReview = (req, res) =>
  runService(res, () =>
    reviewService.hotelReviewService
      .replyAsOwner(req.params.id, req.user.id, req.body?.response)
      .then((review) => ({
        status: 200,
        body: { message: "Phản hồi đã được gửi thành công", review },
      }))
  );

exports.staffReplyToReview = (req, res) =>
  runService(res, () =>
    reviewService.hotelReviewService
      .replyAsStaff(req.params.id, req.user.id, req.body?.response)
      .then((review) => ({
        status: 200,
        body: { message: "Phản hồi đã được gửi thành công", review },
      }))
  );

exports.deleteReply = (req, res) =>
  runService(res, () =>
    reviewService.hotelReviewService
      .deleteReplyAsOwner(req.params.id, req.user.id)
      .then((review) => ({
        status: 200,
        body: { message: "Phản hồi đã được xóa thành công", review },
      }))
  );

exports.staffDeleteReply = (req, res) =>
  runService(res, () =>
    reviewService.hotelReviewService
      .deleteReplyAsStaff(req.params.id, req.user.id)
      .then((review) => ({
        status: 200,
        body: { message: "Phản hồi đã được xóa thành công", review },
      }))
  );
