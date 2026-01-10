const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");

// Thêm đánh giá cho booking sau khi checkout
exports.addReview = async (req, res) => {
  try {
    const { id } = req.params; // booking ID
    const userId = req.user.id;
    const { rating, comment } = req.body;

    console.log(`Người dùng ${userId} đang thêm đánh giá cho booking ${id}`);

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: "Rating phải là số từ 1 đến 5" 
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ 
        message: "Nội dung đánh giá không được để trống" 
      });
    }

    if (comment.trim().length > 2000) {
      return res.status(400).json({ 
        message: "Nội dung đánh giá không được vượt quá 2000 ký tự" 
      });
    }

    // Tìm booking và populate hotel
    const booking = await Booking.findById(id)
      .populate({
        path: "hotel",
        select: "_id name"
      });

    if (!booking) {
      console.log(`Không tìm thấy booking với ID: ${id}`);
      return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
    }

    // Kiểm tra booking thuộc về user hiện tại
    if (booking.guest.toString() !== userId) {
      console.log(`User ${userId} không có quyền đánh giá booking ${id}`);
      return res.status(403).json({ 
        message: "Bạn không có quyền đánh giá đơn đặt phòng này" 
      });
    }

    // Kiểm tra booking đã checkout chưa
    if (!booking.checkedOutAt) {
      console.log(`Không thể đánh giá booking ${id}: chưa checkout`);
      return res.status(400).json({ 
        message: "Bạn chỉ có thể đánh giá sau khi đã checkout" 
      });
    }

    // Kiểm tra đã đánh giá booking này chưa
    const existingReview = await Review.findOne({ booking: id });
    if (existingReview) {
      console.log(`Booking ${id} đã được đánh giá trước đó`);
      return res.status(400).json({ 
        message: "Bạn đã đánh giá đơn đặt phòng này rồi" 
      });
    }

    // Kiểm tra hotel tồn tại
    if (!booking.hotel || !booking.hotel._id) {
      console.log(`Không tìm thấy thông tin khách sạn cho booking ${id}`);
      return res.status(400).json({ 
        message: "Không tìm thấy thông tin khách sạn" 
      });
    }

    // Tạo review mới - Tất cả review được hiển thị tự động, không có kiểm duyệt
    // Đảm bảo đánh giá phản ánh đúng thực tế khách sạn
    const review = new Review({
      guest: userId,
      hotel: booking.hotel._id,
      booking: id,
      rating: parseInt(rating),
      comment: comment.trim()
    });

    await review.save();

    // Populate thông tin guest và hotel để trả về
    await review.populate([
      {
        path: "guest",
        select: "name email"
      },
      {
        path: "hotel",
        select: "name"
      },
      {
        path: "booking",
        select: "checkInDate checkOutDate"
      }
    ]);

    console.log(`Đã tạo review thành công cho booking ${id} bởi user ${userId}`);
    res.status(201).json({
      message: "Đánh giá đã được gửi thành công",
      review
    });
  } catch (error) {
    console.error("Lỗi khi thêm đánh giá:", error);
    
    // Xử lý lỗi duplicate key (nếu unique index bị vi phạm)
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Bạn đã đánh giá đơn đặt phòng này rồi" 
      });
    }
    
    res.status(500).json({ 
      message: "Lỗi khi thêm đánh giá", 
      error: error.message 
    });
  }
};

// Lấy danh sách đánh giá của khách sạn (có thể dùng cho trang chi tiết khách sạn)
// Tất cả đánh giá được hiển thị tự động, không có kiểm duyệt
exports.getReviewsByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    console.log(`Lấy danh sách đánh giá cho khách sạn ${hotelId}`);

    // Kiểm tra hotel tồn tại
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Lấy tất cả reviews - không filter theo status (tất cả đều hiển thị)
    const reviews = await Review.find({ 
      hotel: hotelId
    })
      .populate({
        path: "guest",
        select: "name email"
      })
      .populate({
        path: "booking",
        select: "checkInDate checkOutDate"
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Đếm tổng số reviews (tất cả đều hiển thị)
    const totalReviews = await Review.countDocuments({ 
      hotel: hotelId
    });

    // Tính toán rating trung bình (tất cả reviews)
    const ratingStats = await Review.aggregate([
      { $match: { hotel: hotel._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating"
          }
        }
      }
    ]);

    const stats = ratingStats[0] || {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: []
    };

    // Đếm từng mức rating
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    stats.ratingDistribution.forEach(rating => {
      if (ratingCounts[rating] !== undefined) {
        ratingCounts[rating]++;
      }
    });

    res.status(200).json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalReviews,
        pages: Math.ceil(totalReviews / parseInt(limit))
      },
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalRatings: stats.totalRatings,
        ratingCounts
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đánh giá:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy danh sách đánh giá", 
      error: error.message 
    });
  }
};

// Lấy đánh giá theo booking ID
// LƯU Ý: Review là công khai nên không giới hạn quyền xem
// Bất kỳ user nào đã authenticated đều có thể xem review (vì review đã hiển thị công khai trên trang khách sạn)
exports.getReviewByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    console.log(`Lấy đánh giá cho booking ${bookingId}`);

    // Tìm review
    const review = await Review.findOne({ booking: bookingId })
      .populate({
        path: "guest",
        select: "name email"
      })
      .populate({
        path: "hotel",
        select: "name"
      })
      .populate({
        path: "booking",
        select: "checkInDate checkOutDate"
      });

    if (!review) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    // Review là công khai - không cần kiểm tra quyền
    // Vì review đã được hiển thị công khai trên trang chi tiết khách sạn
    res.status(200).json(review);
  } catch (error) {
    console.error("Lỗi khi lấy đánh giá:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy đánh giá", 
      error: error.message 
    });
  }
};

// Cập nhật đánh giá
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params; // review ID
    const userId = req.user.id;
    const { rating, comment } = req.body;

    console.log(`User ${userId} đang cập nhật review ${id}`);

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: "Rating phải là số từ 1 đến 5" 
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ 
        message: "Nội dung đánh giá không được để trống" 
      });
    }

    if (comment.trim().length > 2000) {
      return res.status(400).json({ 
        message: "Nội dung đánh giá không được vượt quá 2000 ký tự" 
      });
    }

    // Tìm review
    const review = await Review.findById(id);

    if (!review) {
      console.log(`Không tìm thấy review với ID: ${id}`);
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    // Kiểm tra quyền: chỉ guest tạo review mới có quyền sửa
    if (review.guest.toString() !== userId) {
      console.log(`User ${userId} không có quyền sửa review ${id}`);
      return res.status(403).json({ 
        message: "Bạn không có quyền sửa đánh giá này" 
      });
    }

    // Cập nhật review
    review.rating = parseInt(rating);
    review.comment = comment.trim();
    review.updatedAt = new Date();
    await review.save();

    // Populate thông tin để trả về
    await review.populate([
      {
        path: "guest",
        select: "name email"
      },
      {
        path: "hotel",
        select: "name"
      },
      {
        path: "booking",
        select: "checkInDate checkOutDate"
      }
    ]);

    console.log(`Đã cập nhật review ${id} thành công bởi user ${userId}`);
    res.status(200).json({
      message: "Đánh giá đã được cập nhật thành công",
      review
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật đánh giá:", error);
    res.status(500).json({ 
      message: "Lỗi khi cập nhật đánh giá", 
      error: error.message 
    });
  }
};

// Xóa đánh giá
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params; // review ID
    const userId = req.user.id;

    console.log(`User ${userId} đang xóa review ${id}`);

    // Tìm review
    const review = await Review.findById(id);

    if (!review) {
      console.log(`Không tìm thấy review với ID: ${id}`);
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    // Kiểm tra quyền: chỉ guest tạo review mới có quyền xóa
    if (review.guest.toString() !== userId) {
      console.log(`User ${userId} không có quyền xóa review ${id}`);
      return res.status(403).json({ 
        message: "Bạn không có quyền xóa đánh giá này" 
      });
    }

    // Xóa review
    await Review.findByIdAndDelete(id);

    console.log(`Đã xóa review ${id} thành công bởi user ${userId}`);
    res.status(200).json({
      message: "Đánh giá đã được xóa thành công"
    });
  } catch (error) {
    console.error("Lỗi khi xóa đánh giá:", error);
    res.status(500).json({ 
      message: "Lỗi khi xóa đánh giá", 
      error: error.message 
    });
  }
};

