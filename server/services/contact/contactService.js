const ContactMessage = require("../../models/ContactMessage");
const { sendContactReplyEmail } = require("../emails");
const { isValidObjectId } = require("../../lib/ids/mongooseIds");
const { ServiceError } = require("../../lib/http/serviceError");

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

async function submitContact(body) {
  const name = sanitizeText(body?.name);
  const email = sanitizeText(body?.email).toLowerCase();
  const phone = sanitizeText(body?.phone);
  const subject = sanitizeText(body?.subject);
  const message = sanitizeText(body?.message);

  if (!name || !email || !subject || !message) {
    throw new ServiceError(400, "Vui lòng điền đầy đủ họ tên, email, tiêu đề và nội dung.");
  }

  if (
    name.length > CONTACT_FIELD_MAX_LENGTH.name ||
    email.length > CONTACT_FIELD_MAX_LENGTH.email ||
    phone.length > CONTACT_FIELD_MAX_LENGTH.phone ||
    subject.length > CONTACT_FIELD_MAX_LENGTH.subject ||
    message.length > CONTACT_FIELD_MAX_LENGTH.message
  ) {
    throw new ServiceError(400, "Dữ liệu liên hệ vượt quá độ dài cho phép.");
  }

  if (!EMAIL_REGEX.test(email)) throw new ServiceError(400, "Email không hợp lệ.");
  if (phone && !PHONE_REGEX.test(phone)) throw new ServiceError(400, "Số điện thoại không hợp lệ.");

  try {
    await ContactMessage.create({ name, email, phone, subject, message });
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstErrorMessage =
        Object.values(error.errors || {})[0]?.message || "Dữ liệu liên hệ không hợp lệ.";
      throw new ServiceError(400, firstErrorMessage);
    }
    throw error;
  }

  return {
    status: 200,
    body: { message: "Cảm ơn bạn đã liên hệ. Quản trị viên sẽ phản hồi sớm nhất có thể." },
  };
}

async function getContactMessages({
  page = 1,
  limit = 20,
  isRead,
  replied,
  searchName,
  searchEmail,
  searchPhone,
  searchSubject,
  searchContent,
}) {
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (parsedPage - 1) * parsedLimit;

  const query = {};
  if (isRead === "true") query.isRead = true;
  if (isRead === "false") query.isRead = false;
  if (replied === "true") query.repliedAt = { $ne: null };
  if (replied === "false") query.repliedAt = null;

  const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const name = sanitizeText(searchName);
  const email = sanitizeText(searchEmail);
  const phone = sanitizeText(searchPhone);
  const subject = sanitizeText(searchSubject);
  const content = sanitizeText(searchContent);

  if (name) query.name = { $regex: escapeRegex(name), $options: "i" };
  if (email) query.email = { $regex: escapeRegex(email), $options: "i" };
  if (phone) query.phone = { $regex: escapeRegex(phone), $options: "i" };
  if (subject) query.subject = { $regex: escapeRegex(subject), $options: "i" };
  if (content) query.message = { $regex: escapeRegex(content), $options: "i" };

  const [messages, total, unreadCount] = await Promise.all([
    ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate("repliedBy", "name email"),
    ContactMessage.countDocuments(query),
    ContactMessage.countDocuments({ isRead: false }),
  ]);

  return {
    status: 200,
    body: {
      messages,
      unreadCount,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    },
  };
}

async function markContactMessageAsRead({ id }) {
  if (!isValidObjectId(id)) throw new ServiceError(400, "ID liên hệ không hợp lệ.");

  const message = await ContactMessage.findById(id);
  if (!message) throw new ServiceError(404, "Không tìm thấy liên hệ.");

  if (!message.isRead) {
    message.isRead = true;
    message.readAt = new Date();
    await message.save();
  }

  return {
    status: 200,
    body: { message: "Đã đánh dấu liên hệ là đã đọc.", contactMessage: message },
  };
}

async function replyContactMessage({ id, adminUserId, replyMessage: rawReply }) {
  const replyMessage = sanitizeText(rawReply);

  if (!isValidObjectId(id)) throw new ServiceError(400, "ID liên hệ không hợp lệ.");
  if (!replyMessage) throw new ServiceError(400, "Vui lòng nhập nội dung phản hồi.");
  if (replyMessage.length > 3000) {
    throw new ServiceError(400, "Nội dung phản hồi không được vượt quá 3000 ký tự.");
  }

  const contactMessage = await ContactMessage.findById(id);
  if (!contactMessage) throw new ServiceError(404, "Không tìm thấy liên hệ.");

  const sent = await sendContactReplyEmail({
    to: contactMessage.email,
    recipientName: contactMessage.name,
    originalSubject: contactMessage.subject,
    originalMessage: contactMessage.message,
    replyMessage,
  });

  if (!sent) {
    throw new ServiceError(500, "Không thể gửi email phản hồi. Vui lòng thử lại sau.");
  }

  const now = new Date();
  if (!contactMessage.isRead) {
    contactMessage.isRead = true;
    contactMessage.readAt = now;
  }
  contactMessage.replyMessage = replyMessage;
  contactMessage.repliedAt = now;
  contactMessage.repliedBy = adminUserId;
  await contactMessage.save();

  const updated = await ContactMessage.findById(id).populate("repliedBy", "name email");
  return {
    status: 200,
    body: { message: "Đã gửi email phản hồi thành công.", contactMessage: updated },
  };
}

async function deleteContactMessage({ id }) {
  if (!isValidObjectId(id)) throw new ServiceError(400, "ID liên hệ không hợp lệ.");

  const message = await ContactMessage.findByIdAndDelete(id);
  if (!message) throw new ServiceError(404, "Không tìm thấy liên hệ.");

  return {
    status: 200,
    body: { message: "Đã xóa tin nhắn liên hệ." },
  };
}

module.exports = {
  submitContact,
  getContactMessages,
  markContactMessageAsRead,
  replyContactMessage,
  deleteContactMessage,
};
