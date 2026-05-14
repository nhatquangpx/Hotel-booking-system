const { sendEmail } = require("./emailService");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Ghép địa chỉ khách sạn (cùng quy ước bookingEmail). */
function formatHotelAddressLine(addr) {
  if (!addr || typeof addr !== "object") return "";
  const n = String(addr.number ?? "").trim();
  const s = String(addr.street ?? "").trim();
  const c = String(addr.city ?? "").trim();
  const line1 = [n, s].filter(Boolean).join(" ").trim();
  const parts = [line1, c].filter(Boolean);
  return parts.join(", ").trim();
}

/**
 * Email HTML báo thiết bị hỏng cho đối tác bảo trì (cùng visual language với bookingEmail).
 * @param {string} to
 * @param {{ hotelName: string, hotelAddress?: { number?: string, street?: string, city?: string }, ownerName?: string, rows: { roomNumber: string, name: string }[] }} params
 * @returns {Promise<boolean>}
 */
async function sendMaintenanceRepairRequestEmail(to, params) {
  const hotelNameRaw = params?.hotelName != null ? String(params.hotelName) : "";
  const ownerNameRaw = params?.ownerName != null ? String(params.ownerName).trim() : "";
  const rows = Array.isArray(params?.rows) ? params.rows : [];

  const safeHotel = escapeHtml(hotelNameRaw || "Khách sạn");
  const safeOwner = escapeHtml(ownerNameRaw);
  const addressLine = formatHotelAddressLine(params?.hotelAddress);
  const safeAddress = addressLine ? escapeHtml(addressLine) : "";
  const count = rows.length;

  const sentAt = new Date().toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const introHtml = ownerNameRaw
    ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#333;">
        Kính gửi Quý đối tác bảo trì,<br /><br />
        <strong>${safeOwner}</strong> (chủ khách sạn) gửi danh sách thiết bị cần xử lý tại <strong>${safeHotel}</strong>.
      </p>`
    : `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#333;">
        Kính gửi Quý đối tác bảo trì,<br /><br />
        Có báo cáo thiết bị cần xử lý tại <strong>${safeHotel}</strong>.
      </p>`;

  const tableRows = rows
    .map((r, index) => {
      const bg = index % 2 === 0 ? "#ffffff" : "#f9fafb";
      return `
      <tr>
        <td align="center" style="padding:12px 14px;border-bottom:1px solid #eceff3;font-size:14px;color:#1C1B1F;text-align:center;vertical-align:middle;background:${bg};width:52px;">
          ${index + 1}
        </td>
        <td align="center" style="padding:12px 14px;border-bottom:1px solid #eceff3;font-size:14px;color:#1C1B1F;font-weight:600;text-align:center;vertical-align:middle;background:${bg};">
          ${escapeHtml(r.roomNumber != null ? String(r.roomNumber) : "—")}
        </td>
        <td align="center" style="padding:12px 14px;border-bottom:1px solid #eceff3;font-size:14px;color:#1C1B1F;text-align:center;vertical-align:middle;background:${bg};">
          ${escapeHtml(r.name != null ? String(r.name) : "—")}
        </td>
      </tr>`;
    })
    .join("");

  const subject = `[Báo sửa chữa] ${hotelNameRaw || "Khách sạn"}`;

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .repair-meta-table td { display: block !important; width: 100% !important; text-align: left !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1C1B1F;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f6f8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620" style="max-width:620px;width:100%;background:#ffffff;border:1px solid #ececec;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:26px 24px 20px;background:linear-gradient(180deg,#A0826D 0%,#8a6f5a 100%);text-align:center;">
              <h1 style="margin:0;font-size:22px;line-height:1.25;color:#ffffff;letter-spacing:0.04em;font-weight:700;">
                BÁO CÁO THIẾT BỊ CẦN SỬA CHỮA
              </h1>
              <p style="margin:10px 0 0;font-size:13px;line-height:1.5;color:rgba(255,255,255,0.92);">
                Thông báo từ hệ thống quản lý khách sạn
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #F5C842;border-radius:10px;background:#fffbeb;">
                <tr>
                  <td style="padding:14px 16px;text-align:center;">
                    <p style="margin:0;font-size:15px;font-weight:700;color:#8a6a1f;line-height:1.4;">
                      ${count} thiết bị ở trạng thái <span style="white-space:nowrap;">« Hỏng »</span>
                    </p>
                    <p style="margin:6px 0 0;font-size:13px;color:#6b5a2a;line-height:1.5;">
                      Vui lòng xem chi tiết theo bảng bên dưới và phối hợp lịch sửa chữa với khách sạn.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px 8px;">
              ${introHtml}
              <table class="repair-meta-table" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e7e9ec;border-radius:8px;background:#f9fafb;">
                <tr>
                  <td style="padding:12px 14px;border-bottom:1px solid #eceff3;font-size:13px;color:#79747E;width:38%;font-weight:600;">
                    Khách sạn
                  </td>
                  <td style="padding:12px 14px;border-bottom:1px solid #eceff3;font-size:14px;color:#1C1B1F;">
                    ${safeHotel}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;border-bottom:1px solid #eceff3;font-size:13px;color:#79747E;width:38%;font-weight:600;vertical-align:top;">
                    Địa chỉ khách sạn
                  </td>
                  <td style="padding:12px 14px;border-bottom:1px solid #eceff3;font-size:14px;color:#1C1B1F;line-height:1.55;">
                    ${
                      safeAddress
                        ? safeAddress
                        : `<span style="color:#79747E;font-style:italic;">Chưa có địa chỉ đầy đủ trên hệ thống — vui lòng liên hệ chủ khách sạn.</span>`
                    }
                  </td>
                </tr>
                ${
                  ownerNameRaw
                    ? `<tr>
                  <td style="padding:12px 14px;border-bottom:1px solid #eceff3;font-size:13px;color:#79747E;font-weight:600;">
                    Người gửi báo cáo
                  </td>
                  <td style="padding:12px 14px;border-bottom:1px solid #eceff3;font-size:14px;color:#1C1B1F;">
                    ${safeOwner}
                  </td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding:12px 14px;font-size:13px;color:#79747E;font-weight:600;">
                    Thời gian gửi
                  </td>
                  <td style="padding:12px 14px;font-size:14px;color:#1C1B1F;">
                    ${escapeHtml(sentAt)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 6px;">
              <p style="margin:0;font-size:16px;font-weight:700;color:#A0826D;padding-bottom:8px;border-bottom:2px solid #e9ecef;">
                Chi tiết thiết bị
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e7e9ec;border-radius:8px;overflow:hidden;">
                <thead>
                  <tr>
                    <th align="center" style="padding:12px 10px;background:#A0826D;color:#ffffff;font-size:13px;font-weight:700;text-align:center;vertical-align:middle;width:52px;">
                      STT
                    </th>
                    <th align="center" style="padding:12px 14px;background:#A0826D;color:#ffffff;font-size:13px;font-weight:700;text-align:center;vertical-align:middle;">
                      Phòng
                    </th>
                    <th align="center" style="padding:12px 14px;background:#A0826D;color:#ffffff;font-size:13px;font-weight:700;text-align:center;vertical-align:middle;">
                      Tên thiết bị
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 22px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg,rgba(160,130,109,0.12) 0%,rgba(160,130,109,0.05) 100%);border-radius:8px;border:1px solid rgba(160,130,109,0.25);">
                <tr>
                  <td style="padding:14px 16px;text-align:center;">
                    <p style="margin:0;font-size:13px;line-height:1.65;color:#5c5348;">
                      Email được gửi tự động từ hệ thống quản lý khách sạn.<br />
                      Nếu cần thêm thông tin, vui lòng liên hệ trực tiếp với chủ khách sạn.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 22px;border-top:1px solid #e9ecef;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#79747E;">
                © Hệ thống đặt phòng khách sạn — Thông báo kỹ thuật / bảo trì
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail(to, subject, html);
}

module.exports = {
  sendMaintenanceRepairRequestEmail,
};
