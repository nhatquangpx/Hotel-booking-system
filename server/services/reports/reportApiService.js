const reportService = require("./reportService");
const { ServiceError } = require("../../lib/http/serviceError");

async function exportOwnerReport({ ownerId, from, to, hotelId }) {
  try {
    const payload = await reportService.getOwnerReportExcel(
      ownerId,
      hotelId || null,
      from,
      to
    );
    return {
      download: {
        body: payload.body,
        filename: payload.filename,
        contentType: payload.contentType,
      },
    };
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(error.statusCode || 500, error.message || "Lỗi xuất báo cáo");
  }
}

async function exportAdminReport({ from, to, hotelId }) {
  try {
    const payload = await reportService.getAdminReportExcel(hotelId || null, from, to);
    return {
      download: {
        body: payload.body,
        filename: payload.filename,
        contentType: payload.contentType,
      },
    };
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(error.statusCode || 500, error.message || "Lỗi xuất báo cáo");
  }
}

module.exports = { exportOwnerReport, exportAdminReport };
