const Review = require("../../models/Review");
const Booking = require("../../models/Booking");
const Hotel = require("../../models/Hotel");
const { notifyNewReview } = require("../notifications");
const { enrichReviewDoc } = require("../../services/reviews/replyHelpers");
const { ServiceError } = require("../../lib/http/serviceError");
const hotelReviewService = require("./hotelReviewService");

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

async function getReviewsByHotel({ hotelId, page = 1, limit = 10 }) {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw new ServiceError(404, "Không tìm thấy khách sạn");

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const reviews = await Review.find({ hotel: hotelId })
    .populate({ path: "guest", select: "name email" })
    .populate({ path: "booking", select: "checkInDate checkOutDate" })
    .populate({ path: "replyBy", select: "name" })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  const totalReviews = await Review.countDocuments({ hotel: hotelId });
  const ratingStats = await Review.aggregate([
    { $match: { hotel: hotel._id } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
        ratingDistribution: { $push: "$rating" },
      },
    },
  ]);

  const stats = ratingStats[0] || {
    averageRating: 0,
    totalRatings: 0,
    ratingDistribution: [],
  };

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  stats.ratingDistribution.forEach((r) => {
    if (ratingCounts[r] !== undefined) ratingCounts[r]++;
  });

  return {
    status: 200,
    body: {
      reviews: reviews.map(enrichReviewDoc),
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: totalReviews,
        pages: Math.ceil(totalReviews / parseInt(limit, 10)),
      },
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalRatings: stats.totalRatings,
        ratingCounts,
      },
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

module.exports = {
  addReview,
  getReviewsByHotel,
  getReviewByBooking,
  updateReview,
  deleteReview,
  hotelReviewService,
};
