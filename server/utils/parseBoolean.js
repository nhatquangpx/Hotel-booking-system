/**
 * Chuẩn hóa giá trị boolean từ JSON body hoặc form (chuỗi 'true'/'false', 0/1).
 * @param {*} value
 * @returns {boolean | undefined | null}
 *   - `true` / `false`: giá trị hợp lệ đã chuẩn hóa
 *   - `undefined`: không gửi hoặc bỏ trống (`undefined`, `null`, `''`)
 *   - `null`: giá trị không nhận dạng được (cần báo lỗi cho client)
 */
function parseOptionalBoolean(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return null;
}

/**
 * @param {*} value
 * @returns {{ ok: true, value: boolean } | { ok: false, message: string }}
 */
function parseRequiredBoolean(value, fieldName = "isActive") {
  const parsed = parseOptionalBoolean(value);
  if (parsed === undefined) {
    return { ok: false, message: `Cần gửi ${fieldName} (true = mở, false = đóng)` };
  }
  if (parsed === null) {
    return { ok: false, message: `${fieldName} phải là true hoặc false` };
  }
  return { ok: true, value: parsed };
}

module.exports = {
  parseOptionalBoolean,
  parseRequiredBoolean,
};
