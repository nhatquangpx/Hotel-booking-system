const Review = require("../../models/Review");
const { getScopedHotelIdsForOwner } = require("../dashboards/core");
const { findHotelByStaffId, staffCanAccessHotel } = require("../../services/hotels/staffHotel");
const {
  getReplyText,
  applyHotelReply,
  clearHotelReply,
  enrichReviewDoc,
} = require("../../services/reviews/replyHelpers");
const {
  getReviewStatsForHotelIds,
  buildReviewListFilter,
} = require("./reviewQueryHelpers");

function throwHttp(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
}

const reviewListPopulate = [
  { path: "guest", select: "name email phone" },
  { path: "hotel", select: "name" },
  {
    path: "booking",
    select: "checkInDate checkOutDate room",
    populate: { path: "room", select: "roomNumber" },
  },
  { path: "replyBy", select: "name" },
];

async function listReviewsForHotelIds(hotelIds, page = 1, limit = 20, rating = null) {
  const parsedLimit = parseInt(limit, 10);
  const parsedPage = parseInt(page, 10);

  if (!hotelIds.length) {
    return {
      reviews: [],
      pagination: { page: parsedPage, limit: parsedLimit, total: 0, pages: 0 },
      stats: await getReviewStatsForHotelIds(hotelIds),
    };
  }

  const filter = buildReviewListFilter(hotelIds, rating);
  const skip = (parsedPage - 1) * parsedLimit;
  const reviews = await Review.find(filter)
    .populate(reviewListPopulate)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit);

  const total = await Review.countDocuments(filter);
  const stats = await getReviewStatsForHotelIds(hotelIds);

  return {
    reviews: reviews.map(enrichReviewDoc),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages: Math.ceil(total / parsedLimit) || 0,
    },
    stats,
  };
}

async function getReviewsByOwner(ownerId, page, limit, hotelId, rating = null) {
  const hotelIds = await getScopedHotelIdsForOwner(ownerId, hotelId || null);
  return listReviewsForHotelIds(hotelIds, page, limit, rating);
}

async function getReviewsByStaff(staffUserId, page, limit, rating = null) {
  const hotel = await findHotelByStaffId(staffUserId);
  if (!hotel) {
    throwHttp(403, "Tài khoản nhân viên chưa được gán khách sạn");
  }
  return listReviewsForHotelIds([hotel._id], page, limit, rating);
}

async function assertOwnerCanAccessReview(reviewId, ownerId) {
  const review = await Review.findById(reviewId).populate({ path: "hotel", select: "ownerId" });
  if (!review) {
    throwHttp(404, "Không tìm thấy đánh giá");
  }
  if (review.hotel.ownerId.toString() !== ownerId) {
    throwHttp(403, "Bạn không có quyền phản hồi đánh giá này");
  }
  return review;
}

async function assertStaffCanAccessReview(reviewId, staffUserId) {
  const review = await Review.findById(reviewId);
  if (!review) {
    throwHttp(404, "Không tìm thấy đánh giá");
  }
  const hotelId = review.hotel?.toString();
  if (!hotelId || !(await staffCanAccessHotel(staffUserId, hotelId))) {
    throwHttp(403, "Bạn không có quyền phản hồi đánh giá này");
  }
  return review;
}

async function saveReplyAndReturn(review, text, userId, role) {
  applyHotelReply(review, { text, userId, role });
  await review.save();
  await review.populate(reviewListPopulate);
  return enrichReviewDoc(review);
}

async function replyAsOwner(reviewId, ownerId, responseText) {
  const text = typeof responseText === "string" ? responseText.trim() : "";
  if (!text) throwHttp(400, "Nội dung phản hồi không được để trống");
  if (text.length > 2000) throwHttp(400, "Nội dung phản hồi không được vượt quá 2000 ký tự");

  const review = await assertOwnerCanAccessReview(reviewId, ownerId);
  return saveReplyAndReturn(review, text, ownerId, "owner");
}

async function replyAsStaff(reviewId, staffUserId, responseText) {
  const text = typeof responseText === "string" ? responseText.trim() : "";
  if (!text) throwHttp(400, "Nội dung phản hồi không được để trống");
  if (text.length > 2000) throwHttp(400, "Nội dung phản hồi không được vượt quá 2000 ký tự");

  const review = await assertStaffCanAccessReview(reviewId, staffUserId);
  return saveReplyAndReturn(review, text, staffUserId, "staff");
}

async function deleteReplyAsOwner(reviewId, ownerId) {
  const review = await assertOwnerCanAccessReview(reviewId, ownerId);
  if (!getReplyText(review)) {
    throwHttp(400, "Không có phản hồi để xóa");
  }
  clearHotelReply(review);
  await review.save();
  await review.populate(reviewListPopulate);
  return enrichReviewDoc(review);
}

async function deleteReplyAsStaff(reviewId, staffUserId) {
  const review = await assertStaffCanAccessReview(reviewId, staffUserId);
  if (!getReplyText(review)) {
    throwHttp(400, "Không có phản hồi để xóa");
  }
  clearHotelReply(review);
  await review.save();
  await review.populate(reviewListPopulate);
  return enrichReviewDoc(review);
}

module.exports = {
  getReviewsByOwner,
  getReviewsByStaff,
  replyAsOwner,
  replyAsStaff,
  deleteReplyAsOwner,
  deleteReplyAsStaff,
};
