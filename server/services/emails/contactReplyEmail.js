const { sendEmail } = require("./emailService");
const { buildEmailLayout, escapeHtml } = require("./template");

const sendContactReplyEmail = async ({
  to,
  recipientName,
  originalSubject,
  originalMessage,
  replyMessage,
}) => {
  const cleanRecipientName = (recipientName || "Bạn").trim();
  const cleanOriginalSubject = (originalSubject || "Liên hệ từ website").trim();
  const cleanOriginalMessage = (originalMessage || "").trim();
  const cleanReplyMessage = (replyMessage || "").trim();

  const bodyHtml = `
    <div style="margin:0 0 14px;">
      Chúng tôi đã nhận được liên hệ của bạn với tiêu đề
      <strong>${escapeHtml(cleanOriginalSubject)}</strong>.
    </div>
    <div style="margin:14px 0;padding:14px;border-radius:8px;background:#f8f9fa;border:1px solid #e7e9ec;">
      <div style="font-size:13px;color:#79747E;margin-bottom:6px;font-weight:600;">Nội dung bạn đã gửi</div>
      <div style="white-space:pre-wrap;font-size:14px;color:#333;">${escapeHtml(cleanOriginalMessage || "(Không có nội dung)")}</div>
    </div>
    <div style="margin:14px 0;padding:14px;border-radius:8px;background:#fffbe6;border:1px solid #f0d9a7;">
      <div style="font-size:13px;color:#7a5b18;margin-bottom:6px;font-weight:600;">Phản hồi từ StayJourney</div>
      <div style="white-space:pre-wrap;font-size:14px;color:#333;">${escapeHtml(cleanReplyMessage)}</div>
    </div>
  `;

  const html = buildEmailLayout({
    title: "Phản hồi liên hệ từ StayJourney",
    greeting: `Xin chào ${cleanRecipientName},`,
    intro: "Cảm ơn bạn đã liên hệ với chúng tôi.",
    bodyHtml,
    outro: "Nếu cần hỗ trợ thêm, bạn có thể liên hệ qua hotline 0332915004.",
    signature: "Đội ngũ StayJourney",
  });

  return sendEmail(to, `[Phản hồi] ${cleanOriginalSubject}`, html);
};

module.exports = {
  sendContactReplyEmail,
};
