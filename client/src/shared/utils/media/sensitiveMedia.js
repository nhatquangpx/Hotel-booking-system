import api from '@/apis/config/axios';
import { getImageUrl } from '@/constants/images';

/** Các loại ảnh nhạy cảm (khớp server MEDIA_KINDS). */
export const SENSITIVE_MEDIA_KINDS = {
  QR_PROOF: 'qr-proof',
  REFUND_PROOF: 'refund-proof',
  ID_IMAGE_FRONT: 'id-image-front',
  ID_IMAGE_BACK: 'id-image-back',
};

/**
 * Ref private (`cld:authenticated:` / `local:private:`) không dùng trực tiếp làm URL ảnh.
 */
export function isPrivateMediaRef(value) {
  if (!value || typeof value !== 'string') return false;
  return (
    value.startsWith('cld:authenticated:') ||
    value.startsWith('local:private:')
  );
}

/**
 * Tải ảnh nhạy cảm qua API có auth → blob URL để hiển thị trong <img>.
 * Nhớ revokeObjectURL khi đóng preview.
 *
 * @param {'guest'|'owner'|'staff'|'admin'} roleScope
 * @param {string} bookingId
 * @param {string} kind
 */
export async function fetchSensitiveMediaBlobUrl(roleScope, bookingId, kind) {
  const response = await api.get(
    `/${roleScope}/bookings/${bookingId}/sensitive-media/${kind}`,
    { responseType: 'blob' }
  );
  const contentType = response.headers?.['content-type'] || '';
  if (contentType.includes('application/json')) {
    const text = await response.data.text?.() || '';
    let message = 'Không thể tải ảnh';
    try {
      message = JSON.parse(text)?.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return URL.createObjectURL(response.data);
}

/**
 * Preview ảnh nhạy cảm: luôn qua API auth khi là private / CCCD; legacy public URL thì getImageUrl.
 */
export async function resolveProofPreviewUrl({
  roleScope,
  bookingId,
  kind,
  mediaRef,
}) {
  const usePrivateApi =
    kind === SENSITIVE_MEDIA_KINDS.ID_IMAGE_FRONT ||
    kind === SENSITIVE_MEDIA_KINDS.ID_IMAGE_BACK ||
    isPrivateMediaRef(mediaRef) ||
    mediaRef === true;

  if (usePrivateApi) {
    if (!bookingId || !kind) return null;
    return fetchSensitiveMediaBlobUrl(roleScope, bookingId, kind);
  }

  if (!mediaRef) return null;
  return getImageUrl(mediaRef);
}
