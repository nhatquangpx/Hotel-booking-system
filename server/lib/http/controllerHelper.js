const { ServiceError } = require("./serviceError");

async function runService(res, handler, { redirect } = {}) {
  try {
    const result = await handler();
    if (result?.redirect) return res.redirect(result.redirect);
    if (result?.download) {
      const { body, filename, contentType } = result.download;
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      return res.send(body);
    }
    const status = result?.status ?? 200;
    const body = result?.body ?? result;
    return res.status(status).json(body);
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.statusCode).json({
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
        ...(error.error ? { error: error.error } : {}),
      });
    }
    const legacyStatus = error?.statusCode ?? error?.status;
    if (typeof legacyStatus === "number" && legacyStatus >= 400 && legacyStatus < 600) {
      return res.status(legacyStatus).json({
        message: error.message,
        ...(error.success === false ? { success: false } : {}),
      });
    }
    console.error(error);
    return res.status(500).json({
      message: error.message || "Đã xảy ra lỗi máy chủ",
      error: error.message,
    });
  }
}

module.exports = { runService };
