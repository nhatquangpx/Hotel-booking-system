const Review = require("../../models/Review");
const { ServiceError } = require("../../lib/http/serviceError");

function buildRatingCounts(ratingDistribution = []) {
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratingDistribution.forEach((r) => {
    if (ratingCounts[r] !== undefined) ratingCounts[r]++;
  });
  return ratingCounts;
}

async function getReviewStatsForHotelIds(hotelIds) {
  if (!hotelIds.length) {
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingCounts: buildRatingCounts(),
    };
  }

  const ratingStats = await Review.aggregate([
    { $match: { hotel: { $in: hotelIds } } },
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

  return {
    averageRating: Math.round((stats.averageRating || 0) * 10) / 10,
    totalRatings: stats.totalRatings,
    ratingCounts: buildRatingCounts(stats.ratingDistribution),
  };
}

function parseRatingFilter(rating) {
  if (rating === undefined || rating === null || rating === "") {
    return null;
  }
  const parsed = parseInt(rating, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 5) {
    throw new ServiceError(400, "Rating lọc phải là số từ 1 đến 5");
  }
  return parsed;
}

function buildReviewListFilter(hotelIds, rating) {
  const filter = { hotel: { $in: hotelIds } };
  const parsedRating = parseRatingFilter(rating);
  if (parsedRating !== null) {
    filter.rating = parsedRating;
  }
  return filter;
}

function buildSingleHotelReviewFilter(hotelId, rating) {
  const filter = { hotel: hotelId };
  const parsedRating = parseRatingFilter(rating);
  if (parsedRating !== null) {
    filter.rating = parsedRating;
  }
  return filter;
}

module.exports = {
  buildRatingCounts,
  getReviewStatsForHotelIds,
  parseRatingFilter,
  buildReviewListFilter,
  buildSingleHotelReviewFilter,
};
