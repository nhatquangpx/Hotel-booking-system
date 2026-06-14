function getClientIp(req, fallback = "127.0.0.1") {
  if (!req) return fallback;
  const forwarded = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];
  const forwardedFirst =
    typeof forwarded === "string" && forwarded.trim() ? forwarded.split(",")[0].trim() : "";
  const raw =
    (req.ip && String(req.ip).trim()) ||
    forwardedFirst ||
    (req.connection?.remoteAddress && String(req.connection.remoteAddress).trim()) ||
    (req.socket?.remoteAddress && String(req.socket.remoteAddress).trim()) ||
    "";
  return raw || fallback;
}

module.exports = { getClientIp };
