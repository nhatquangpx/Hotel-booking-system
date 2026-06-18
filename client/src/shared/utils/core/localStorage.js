/** Đọc boolean từ localStorage an toàn (JSON hỏng, chuỗi "true"/"false" thuần, v.v.). */
export function readLocalStorageBoolean(key, fallback = false) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === '') return fallback;
    const t = raw.trim();
    if (t === 'true') return true;
    if (t === 'false') return false;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'boolean' ? parsed : fallback;
  } catch {
    return fallback;
  }
}
