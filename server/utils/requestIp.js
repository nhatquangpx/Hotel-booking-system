/**
 * Lấy IP client từ Express request (dùng chung cho giao dịch / thiết bị tin cậy).
 * @param {import("express").Request} req
 * @param {string} [fallback='127.0.0.1'] Trả về khi không suy ra được (vd. device: truyền '')
 */
function getClientIp(req, fallback = "127.0.0.1") {
  if (!req) return fallback;
  const forwarded = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];
  const forwardedFirst =
    typeof forwarded === "string" && forwarded.trim()
      ? forwarded.split(",")[0].trim()
      : "";
  const raw =
    (req.ip && String(req.ip).trim()) ||
    forwardedFirst ||
    (req.connection?.remoteAddress && String(req.connection.remoteAddress).trim()) ||
    (req.socket?.remoteAddress && String(req.socket.remoteAddress).trim()) ||
    "";
  return raw || fallback;
}

module.exports = { getClientIp };
