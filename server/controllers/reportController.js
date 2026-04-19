const reportService = require('../services/reports/reportService');

const sendExport = (res, { body, filename, contentType }) => {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // Cho phép client đọc Content-Disposition khi gọi cross-origin (CORS)
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.send(body);
};

exports.exportOwnerReport = async (req, res) => {
  try {
    const { from, to, hotelId } = req.query;
    const payload = await reportService.getOwnerReportExcel(
      req.user.id,
      hotelId || null,
      from,
      to
    );
    return sendExport(res, payload);
  } catch (error) {
    console.error('Lỗi export báo cáo owner:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Lỗi xuất báo cáo' });
  }
};

exports.exportAdminReport = async (req, res) => {
  try {
    const { from, to, hotelId } = req.query;
    const payload = await reportService.getAdminReportExcel(hotelId || null, from, to);
    return sendExport(res, payload);
  } catch (error) {
    console.error('Lỗi export báo cáo admin:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({ message: error.message || 'Lỗi xuất báo cáo' });
  }
};
