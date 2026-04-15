import React, { useState, useEffect, useCallback } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import { ownerHotelAPI } from '@/apis/owner/hotel';
import { ownerPricingAPI } from '@/apis/owner/pricing';
import { formatCurrency, formatDateTime } from '@/shared/utils/format';
import PriceSuggestionChart from './components/PriceSuggestionChart';
import PricingFilters from './components/PricingFilters';
import PricingDailyTable from './components/PricingDailyTable';
import './DynamicPricingPage.scss';

/**
 * Trang gợi ý giá động cho Owner
 */
const DynamicPricingPage = () => {
  const [hotels, setHotels] = useState([]);
  const [hotelId, setHotelId] = useState('');
  const [days, setDays] = useState(14);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await ownerHotelAPI.getOwnerHotels();
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setHotels(arr);
        if (arr.length) {
          setHotelId((id) => id || arr[0]._id);
        }
      } catch {
        if (!cancelled) setHotels([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPricing = useCallback(async () => {
    if (!hotelId) {
      setPayload(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await ownerPricingAPI.getDynamicPricing({ hotelId, days });
      setPayload(data);
    } catch (e) {
      const data = e?.response?.data;
      const msg =
        (typeof data === 'object' && data?.message) ||
        (typeof e?.message === 'string' && e.message) ||
        'Không tải được dữ liệu giá đề xuất';
      setError(msg);
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [hotelId, days]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const block =
    payload?.hotels?.find((h) => h.hotelId === hotelId) ?? payload?.hotels?.[0] ?? null;
  const roomTypes = block?.roomTypes || [];
  const note = block?.note;
  const roomTypesKey = roomTypes.map((r) => r.type).join('|');

  useEffect(() => {
    if (!block?.roomTypes?.length) return;
    const ids = block.roomTypes.map((r) => r.type);
    setSelectedRoomType((t) => (t && ids.includes(t) ? t : block.roomTypes[0].type));
  }, [hotelId, roomTypesKey]);

  const typeBlock =
    roomTypes.find((r) => r.type === selectedRoomType) ?? roomTypes[0] ?? null;
  const daily = typeBlock?.daily || [];
  const typeSummary = typeBlock?.summary;

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState(null);

  const avgSuggestedForRange =
    daily.length > 0
      ? Math.round(
          daily.reduce((s, r) => s + (r.suggestedNightly || 0), 0) / daily.length / 10000
        ) * 10000
      : 0;

  const handleApplySuggested = async () => {
    if (!hotelId || !selectedRoomType || !daily.length) return;
    setApplyLoading(true);
    setApplyMessage(null);
    try {
      const res = await ownerPricingAPI.applySuggestedPrices({
        hotelId,
        roomType: selectedRoomType,
        days,
      });
      const prevNightly = res.previousAvgNightly ?? res.previousAvgRegular;
      const prevPart =
        prevNightly != null
          ? ` (trước đó TB đêm loại: ${formatCurrency(prevNightly)} → ${formatCurrency(res.avgSuggestedPrice)})`
          : '';
      setApplyMessage(
        `Đã cập nhật ${res.roomsUpdated} phòng loại «${res.roomTypeLabel}» với giá đêm ${formatCurrency(res.avgSuggestedPrice)}${prevPart} — trung bình gợi ý ${days} ngày.`
      );
      setApplyModalOpen(false);
      await fetchPricing();
    } catch (e) {
      const data = e?.response?.data;
      const msg =
        (typeof data === 'object' && data?.message) ||
        (typeof e?.message === 'string' && e.message) ||
        'Không áp dụng được giá gợi ý';
      setApplyMessage(msg);
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="owner-dynamic-pricing">
        <div className="page-header">
          <div>
            <p className="page-desc">
              Gợi ý giá theo loại phòng (Standard, Deluxe, ...): mỗi loại có giá đêm TB riêng,
              tỷ lệ lấp đầy riêng và lịch sử bán theo thứ riêng. Hệ số mùa áp dụng chung theo ngày.
              Công thức là <strong>quy tắc minh bạch</strong> (xem chi tiết từng ngày); quyết định áp dụng giá
              là của bạn. Bạn có thể <strong>áp dụng nhanh</strong> mức trung bình gợi ý trong kỳ đang chọn
              cho toàn bộ phòng cùng loại, hoặc <strong>chỉnh từng phòng</strong> tại sơ đồ phòng.
            </p>
          </div>
        </div>

        <PricingFilters
          hotels={hotels}
          hotelId={hotelId}
          onHotelIdChange={setHotelId}
          roomTypes={roomTypes}
          selectedRoomType={selectedRoomType}
          onRoomTypeChange={setSelectedRoomType}
          days={days}
          onDaysChange={setDays}
          loading={loading}
          onRefresh={fetchPricing}
        />

        {loading && <div className="state-msg">Đang tải...</div>}
        {!loading && error && <div className="state-msg state-msg--error">{error}</div>}
        {!loading && !error && hotels.length === 0 && (
          <div className="state-msg">Bạn chưa có khách sạn để phân tích giá.</div>
        )}

        {!loading && !error && hotels.length > 0 && note && (
          <div className="state-msg state-msg--warn">{note}</div>
        )}

        {!loading && !error && hotels.length > 0 && block && !note && typeBlock && (
          <>
            {typeBlock.lastBulkApply && (
              <div className="pricing-history-banner" role="status">
                <strong>Lần áp dụng gợi ý gần nhất (loại {typeBlock.typeLabel})</strong>
                <p>
                  <time dateTime={typeBlock.lastBulkApply.lastBulkApplyAt}>
                    {formatDateTime(typeBlock.lastBulkApply.lastBulkApplyAt)}
                  </time>
                  {' — '}
                  TB giá đêm thực thu (regular − discount) trước khi áp dụng:{' '}
                  <strong>
                    {formatCurrency(
                      typeBlock.lastBulkApply.previousAvgNightly ??
                        typeBlock.lastBulkApply.previousAvgRegular
                    )}
                  </strong>
                  , sau khi áp dụng:{' '}
                  <strong>
                    {formatCurrency(
                      typeBlock.lastBulkApply.appliedAvgNightly ??
                        typeBlock.lastBulkApply.appliedAvgRegular
                    )}
                  </strong>
                  {(() => {
                    const lb = typeBlock.lastBulkApply;
                    const a = (lb.appliedAvgNightly ?? lb.appliedAvgRegular) ?? 0;
                    const p = (lb.previousAvgNightly ?? lb.previousAvgRegular) ?? 0;
                    const d = a - p;
                    if (d === 0) return ' (không đổi).';
                    if (d < 0) return ` (giảm ${formatCurrency(Math.abs(d))}).`;
                    return ` (tăng ${formatCurrency(d)}).`;
                  })()}{' '}
                  Kỳ gợi ý đã dùng: <strong>{typeBlock.lastBulkApply.daysWindow}</strong> ngày.
                </p>
                <p className="pricing-history-banner__hint">
                  Gợi ý được tính từ <strong>giá TB hiện tại</strong> và các hệ số cố định; nếu bạn vừa hạ giá
                  mà các hệ số (lấp đầy, mùa, thứ) chưa đổi, lần làm mới sau có thể vẫn đề xuất điều chỉnh
                  tiếp — hãy tự cân nhắc, đối chiếu ô trên và dữ liệu đặt phòng thực tế.
                </p>
              </div>
            )}
            <div className="summary-grid summary-grid--3">
              <div className="summary-card">
                <span className="label">Loại phòng</span>
                <strong className="summary-type">
                  {typeBlock.typeLabel}
                  <span className="room-count"> · {typeBlock.roomCount} phòng</span>
                </strong>
              </div>
              <div className="summary-card">
                <span className="label">Giá đêm TB hiện tại (loại này)</span>
                <strong>{formatCurrency(typeBlock.avgCurrentNightly)}</strong>
              </div>
              <div className="summary-card summary-card--highlight">
                <span className="label">Chênh lệch ước tính — loại này (kỳ đã chọn)</span>
                <strong
                  className={
                    (typeSummary?.estimatedAdditionalRevenue ?? 0) >= 0 ? 'positive' : 'negative'
                  }
                >
                  {(typeSummary?.estimatedAdditionalRevenue ?? 0) >= 0 ? '+' : ''}
                  {formatCurrency(typeSummary?.estimatedAdditionalRevenue ?? 0)}
                </strong>
              </div>
            </div>
            {typeSummary?.note && <p className="summary-note">{typeSummary.note}</p>}

            <div className="apply-row">
              <button
                type="button"
                className="btn-apply-suggested"
                onClick={() => {
                  setApplyMessage(null);
                  setApplyModalOpen(true);
                }}
                disabled={loading || !daily.length}
              >
                Áp dụng gợi ý cho loại phòng (kỳ đang xem)
              </button>
              <span className="apply-row-hint">
                Gán <strong>giá đêm</strong> (regular) = trung bình giá đề xuất trong {days} ngày tới cho mọi phòng{' '}
                <strong>{typeBlock.typeLabel}</strong>; giảm giá (discount) đặt về 0. Vẫn chỉnh chi tiết tại sơ đồ phòng.
              </span>
            </div>

            {applyMessage && (
              <div
                className={`state-msg ${
                  applyMessage.startsWith('Đã') ? 'state-msg--success' : 'state-msg--error'
                }`}
              >
                {applyMessage}
              </div>
            )}

            <div className="chart-wrap">
              <PriceSuggestionChart
                daily={daily}
                title={`Giá hiện tại vs đề xuất — ${typeBlock.typeLabel}`}
              />
            </div>

            <PricingDailyTable typeLabel={typeBlock.typeLabel} daily={daily} />
          </>
        )}

        {applyModalOpen && typeBlock && (
          <div
            className="apply-modal-overlay"
            role="presentation"
            onClick={() => !applyLoading && setApplyModalOpen(false)}
          >
            <div
              className="apply-modal"
              role="dialog"
              aria-labelledby="apply-modal-title"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="apply-modal-title">Xác nhận áp dụng giá gợi ý</h3>
              <p>
                Bạn sắp gán <strong>giá đêm (regular)</strong> cho <strong>tất cả phòng đang hoạt động</strong> loại{' '}
                <strong>{typeBlock.typeLabel}</strong> tại khách sạn đang chọn, bằng{' '}
                <strong>{formatCurrency(avgSuggestedForRange)}</strong> — trung bình giá đề xuất trong{' '}
                <strong>{days} ngày</strong> tới (theo bộ lọc hiện tại).
              </p>
              <p className="apply-modal-note">
                Giảm giá (discount) sẽ được đặt về <strong>0</strong>. Bạn vẫn có thể chỉnh riêng từng phòng sau tại{' '}
                <strong>sơ đồ phòng</strong>.
              </p>
              <div className="apply-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  disabled={applyLoading}
                  onClick={() => setApplyModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn-modal-confirm"
                  disabled={applyLoading}
                  onClick={handleApplySuggested}
                >
                  {applyLoading ? 'Đang cập nhật...' : 'Xác nhận áp dụng'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};

export default DynamicPricingPage;
