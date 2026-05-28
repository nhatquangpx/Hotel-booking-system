const ContactMessage = require("../models/ContactMessage");
const { sendContactReplyEmail } = require("../services/emails");
const { isValidObjectId } = require("../utils/mongooseIds");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s().]{8,20}$/;
const CONTACT_FIELD_MAX_LENGTH = {
  name: 100,
  email: 150,
  phone: 30,
  subject: 150,
  message: 3000,
};

const sanitizeText = (value) => String(value || "").trim();

exports.submitContact = async (req, res) => {
  try {
    const name = sanitizeText(req.body?.name);
    const email = sanitizeText(req.body?.email).toLowerCase();
    const phone = sanitizeText(req.body?.phone);
    const subject = sanitizeText(req.body?.subject);
    const message = sanitizeText(req.body?.message);

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: "Vui lòng điền đầy đủ họ tên, email, tiêu đề và nội dung.",
      });
    }

    if (
      name.length > CONTACT_FIELD_MAX_LENGTH.name ||
      email.length > CONTACT_FIELD_MAX_LENGTH.email ||
      phone.length > CONTACT_FIELD_MAX_LENGTH.phone ||
      subject.length > CONTACT_FIELD_MAX_LENGTH.subject ||
      message.length > CONTACT_FIELD_MAX_LENGTH.message
    ) {
      return res.status(400).json({
        message: "Dữ liệu liên hệ vượt quá độ dài cho phép.",
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Email không hợp lệ." });
    }

    if (phone && !PHONE_REGEX.test(phone)) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ." });
    }

    await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
    });

    return res.status(200).json({
      message: "Cảm ơn bạn đã liên hệ. Quản trị viên sẽ phản hồi sớm nhất có thể.",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstErrorMessage =
        Object.values(error.errors || {})[0]?.message ||
        "Dữ liệu liên hệ không hợp lệ.";
      return res.status(400).json({ message: firstErrorMessage });
    }

    console.error("Lỗi khi gửi liên hệ:", error);
    return res.status(500).json({
      message: "Có lỗi xảy ra khi gửi liên hệ. Vui lòng thử lại sau.",
    });
  }
};

exports.getContactMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {};
    if (isRead === "true") query.isRead = true;
    if (isRead === "false") query.isRead = false;

    const [messages, total, unreadCount] = await Promise.all([
      ContactMessage.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate("repliedBy", "name email"),
      ContactMessage.countDocuments(query),
      ContactMessage.countDocuments({ isRead: false }),
    ]);

    return res.status(200).json({
      messages,
      unreadCount,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách liên hệ:", error);
    return res.status(500).json({ message: "Không thể tải danh sách liên hệ." });
  }
};

exports.markContactMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "ID liên hệ không hợp lệ." });
    }

    const message = await ContactMessage.findById(id);

    if (!message) {
      return res.status(404).json({ message: "Không tìm thấy liên hệ." });
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    return res.status(200).json({
      message: "Đã đánh dấu liên hệ là đã đọc.",
      contactMessage: message,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái liên hệ:", error);
    return res.status(500).json({ message: "Không thể cập nhật trạng thái liên hệ." });
  }
};

exports.replyContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const replyMessage = sanitizeText(req.body?.replyMessage);

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "ID liên hệ không hợp lệ." });
    }

    if (!replyMessage) {
      return res.status(400).json({ message: "Vui lòng nhập nội dung phản hồi." });
    }

    if (replyMessage.length > 3000) {
      return res.status(400).json({ message: "Nội dung phản hồi không được vượt quá 3000 ký tự." });
    }

    const contactMessage = await ContactMessage.findById(id);
    if (!contactMessage) {
      return res.status(404).json({ message: "Không tìm thấy liên hệ." });
    }

    const sent = await sendContactReplyEmail({
      to: contactMessage.email,
      recipientName: contactMessage.name,
      originalSubject: contactMessage.subject,
      originalMessage: contactMessage.message,
      replyMessage,
    });

    if (!sent) {
      return res.status(500).json({ message: "Không thể gửi email phản hồi. Vui lòng thử lại sau." });
    }

    const now = new Date();
    if (!contactMessage.isRead) {
      contactMessage.isRead = true;
      contactMessage.readAt = now;
    }
    contactMessage.replyMessage = replyMessage;
    contactMessage.repliedAt = now;
    contactMessage.repliedBy = req.user.id;
    await contactMessage.save();

    const updated = await ContactMessage.findById(id).populate("repliedBy", "name email");

    return res.status(200).json({
      message: "Đã gửi email phản hồi thành công.",
      contactMessage: updated,
    });
  } catch (error) {
    console.error("Lỗi khi phản hồi liên hệ:", error);
    return res.status(500).json({ message: "Không thể gửi phản hồi lúc này." });
  }
};
