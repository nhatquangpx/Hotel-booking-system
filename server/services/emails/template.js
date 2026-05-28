const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildEmailLayout = ({
  title = "",
  greeting = "",
  intro = "",
  bodyHtml = "",
  outro = "",
  signature = "StayJourney Team",
}) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#1C1B1F;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f6f8;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;width:100%;background:#ffffff;border:1px solid #ececec;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:22px 24px;background:#fffaf5;border-bottom:1px solid #f0e5d8;text-align:center;">
                <h2 style="margin:0;font-size:22px;line-height:1.3;color:#A0826D;">${escapeHtml(title)}</h2>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 8px;font-size:15px;line-height:1.7;color:#333;">
                ${greeting ? `<p style="margin:0 0 12px;">${escapeHtml(greeting)}</p>` : ""}
                ${intro ? `<p style="margin:0 0 12px;">${escapeHtml(intro)}</p>` : ""}
                ${bodyHtml}
                ${outro ? `<p style="margin:14px 0 0;">${escapeHtml(outro)}</p>` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px 24px;font-size:13px;line-height:1.7;color:#6d7278;">
                Trân trọng,<br />
                <strong>${escapeHtml(signature)}</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

module.exports = {
  escapeHtml,
  buildEmailLayout,
};
