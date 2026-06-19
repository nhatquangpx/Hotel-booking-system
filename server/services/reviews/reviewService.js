const Review = require("../../models/Review");
const Booking = require("../../models/Booking");
const Hotel = require("../../models/Hotel");
const { notifyNewReview } = require("../notifications");
const { enrichReviewDoc } = require("../../services/reviews/replyHelpers");
const { ServiceError } = require("../../lib/http/serviceError");
const hotelReviewService = require("./hotelReviewService");
const {
  getReviewStatsForHotelIds,
  buildSingleHotelReviewFilter,
} = require("./reviewQueryHelpers");

function validateReviewInput({ rating, comment }) {
  if (!rating || rating < 1 || rating > 5) {
    throw new ServiceError(400, "Rating phải là số từ 1 đến 5");
  }
  if (!comment || !comment.trim()) {
    throw new ServiceError(400, "Nội dung đánh giá không được để trống");
  }
  if (comment.trim().length > 2000) {
    throw new ServiceError(400, "Nội dung đánh giá không được vượt quá 2000 ký tự");
  }
}

async function addReview({ bookingId, userId, rating, comment }) {
  validateReviewInput({ rating, comment });

  const booking = await Booking.findById(bookingId).populate({
    path: "hotel",
    select: "_id name",
  });

  if (!booking) throw new ServiceError(404, "Không tìm thấy đơn đặt phòng");
  if (booking.guest.toString() !== userId) {
    throw new ServiceError(403, "Bạn không có quyền đánh giá đơn đặt phòng này");
  }
  if (!booking.checkedOutAt) {
    throw new ServiceError(400, "Bạn chỉ có thể đánh giá sau khi đã checkout");
  }

  const existingReview = await Review.findOne({ booking: bookingId });
  if (existingReview) {
    throw new ServiceError(400, "Bạn đã đánh giá đơn đặt phòng này rồi");
  }
  if (!booking.hotel?._id) {
    throw new ServiceError(400, "Không tìm thấy thông tin khách sạn");
  }

  const review = new Review({
    guest: userId,
    hotel: booking.hotel._id,
    booking: bookingId,
    rating: parseInt(rating, 10),
    comment: comment.trim(),
  });

  try {
    await review.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new ServiceError(400, "Bạn đã đánh giá đơn đặt phòng này rồi");
    }
    throw error;
  }

  notifyNewReview(review._id).catch((err) =>
    console.error("Lỗi khi tạo thông báo đánh giá mới:", err)
  );

  await review.populate([
    { path: "guest", select: "name email" },
    { path: "hotel", select: "name" },
    { path: "booking", select: "checkInDate checkOutDate" },
  ]);

  return {
    status: 201,
    body: { message: "Đánh giá đã được gửi thành công", review },
  };
}

async function getReviewsByHotel({ hotelId, page = 1, limit = 10, rating = null }) {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw new ServiceError(404, "Không tìm thấy khách sạn");

  const parsedLimit = parseInt(limit, 10);
  const parsedPage = parseInt(page, 10);
  const filter = buildSingleHotelReviewFilter(hotelId, rating);

  const skip = (parsedPage - 1) * parsedLimit;
  const reviews = await Review.find(filter)
    .populate({ path: "guest", select: "name email" })
    .populate({ path: "booking", select: "checkInDate checkOutDate" })
    .populate({ path: "replyBy", select: "name" })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit);

  const totalReviews = await Review.countDocuments(filter);
  const stats = await getReviewStatsForHotelIds([hotel._id]);

  return {
    status: 200,
    body: {
      reviews: reviews.map(enrichReviewDoc),
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: totalReviews,
        pages: Math.ceil(totalReviews / parsedLimit) || 0,
      },
      stats,
    },
  };
}

async function getReviewByBooking({ bookingId }) {
  const review = await Review.findOne({ booking: bookingId })
    .populate({ path: "guest", select: "name email" })
    .populate({ path: "hotel", select: "name" })
    .populate({ path: "booking", select: "checkInDate checkOutDate" });

  if (!review) throw new ServiceError(404, "Không tìm thấy đánh giá");
  return { status: 200, body: review };
}

async function updateReview({ reviewId, userId, rating, comment }) {
  validateReviewInput({ rating, comment });

  const review = await Review.findById(reviewId);
  if (!review) throw new ServiceError(404, "Không tìm thấy đánh giá");
  if (review.guest.toString() !== userId) {
    throw new ServiceError(403, "Bạn không có quyền sửa đánh giá này");
  }

  review.rating = parseInt(rating, 10);
  review.comment = comment.trim();
  review.updatedAt = new Date();
  await review.save();

  await review.populate([
    { path: "guest", select: "name email" },
    { path: "hotel", select: "name" },
    { path: "booking", select: "checkInDate checkOutDate" },
  ]);

  return {
    status: 200,
    body: { message: "Đánh giá đã được cập nhật thành công", review },
  };
}

async function deleteReview({ reviewId, userId }) {
  const review = await Review.findById(reviewId);
  if (!review) throw new ServiceError(404, "Không tìm thấy đánh giá");
  if (review.guest.toString() !== userId) {
    throw new ServiceError(403, "Bạn không có quyền xóa đánh giá này");
  }

  await Review.findByIdAndDelete(reviewId);
  return { status: 200, body: { message: "Đánh giá đã được xóa thành công" } };
}

async function getReviewsByOwner({ ownerId, page, limit, hotelId, rating }) {
  const body = await hotelReviewService.getReviewsByOwner(
    ownerId,
    page,
    limit,
    hotelId || null,
    rating
  );
  return { status: 200, body };
}

async function getStaffReviews({ staffId, page, limit, rating }) {
  const body = await hotelReviewService.getReviewsByStaff(staffId, page, limit, rating);
  return { status: 200, body };
}

async function replyToReview({ reviewId, ownerId, response }) {
  const review = await hotelReviewService.replyAsOwner(reviewId, ownerId, response);
  return {
    status: 200,
    body: { message: "Phản hồi đã được gửi thành công", review },
  };
}

async function staffReplyToReview({ reviewId, staffId, response }) {
  const review = await hotelReviewService.replyAsStaff(reviewId, staffId, response);
  return {
    status: 200,
    body: { message: "Phản hồi đã được gửi thành công", review },
  };
}

async function deleteReply({ reviewId, ownerId }) {
  const review = await hotelReviewService.deleteReplyAsOwner(reviewId, ownerId);
  return {
    status: 200,
    body: { message: "Phản hồi đã được xóa thành công", review },
  };
}

async function staffDeleteReply({ reviewId, staffId }) {
  const review = await hotelReviewService.deleteReplyAsStaff(reviewId, staffId);
  return {
    status: 200,
    body: { message: "Phản hồi đã được xóa thành công", review },
  };
}

module.exports = {
  addReview,
  getReviewsByHotel,
  getReviewByBooking,
  updateReview,
  deleteReview,
  getReviewsByOwner,
  getStaffReviews,
  replyToReview,
  staffReplyToReview,
  deleteReply,
  staffDeleteReply,
};
