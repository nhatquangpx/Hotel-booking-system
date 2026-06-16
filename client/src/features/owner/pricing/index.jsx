import React, { useState, useEffect, useCallback } from 'react';
import OwnerLayout from '../components/OwnerLayout';
import OwnerGuideCollapsible from '../components/OwnerGuideCollapsible';
import { useOwnerHotel } from '../context/OwnerHotelContext';
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
  const { selectedHotelId: hotelId, hotels, loading: hotelsLoading } = useOwnerHotel();
  const [days, setDays] = useState(14);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState('');

  const fetchPricing = useCallback(async () => {
    if (hotelsLoading) {
      return;
    }
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
  }, [hotelId, days, hotelsLoading]);

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
  const [applyTarget, setApplyTarget] = useState(null);

  const avgSuggestedForRange =
    daily.length > 0
      ? Math.round(
          daily.reduce((s, r) => s + (r.suggestedNightly || 0), 0) / daily.length / 10000
        ) * 10000
      : 0;

  const openApplyModal = (target) => {
    setApplyMessage(null);
    setApplyTarget(target);
    setApplyModalOpen(true);
  };

  const closeApplyModal = () => {
    if (applyLoading) return;
    setApplyModalOpen(false);
    setApplyTarget(null);
  };

  const handleApplySuggested = async () => {
    if (!hotelId || !selectedRoomType || !applyTarget) return;
    setApplyLoading(true);
    setApplyMessage(null);
    try {
      const body = {
        hotelId,
        roomType: selectedRoomType,
        days,
      };
      if (applyTarget.mode === 'day') {
        body.date = applyTarget.date;
      }

      const res = await ownerPricingAPI.applySuggestedPrices(body);
      const prevNightly = res.previousAvgNightly;
      const appliedPrice = res.appliedNightly ?? res.avgSuggestedPrice;
      const prevPart =
        prevNightly != null
          ? ` (trước đó TB đêm loại: ${formatCurrency(prevNightly)} → ${formatCurrency(appliedPrice)})`
          : '';

      const detail =
        applyTarget.mode === 'day'
          ? `ngày ${applyTarget.date} (${applyTarget.weekdayLabel})`
          : `trung bình ${days} ngày`;

      setApplyMessage(
        `Đã cập nhật ${res.roomsUpdated} phòng loại «${res.roomTypeLabel}» với giá đêm ${formatCurrency(appliedPrice)}${prevPart} — theo gợi ý ${detail}.`
      );
      setApplyModalOpen(false);
      setApplyTarget(null);
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
          <OwnerGuideCollapsible label="Hướng dẫn giá gợi ý — bấm để xem">
            <div className="pricing-guide-card">
              <div className="pricing-guide-card__intro">
                <h3>Hướng dẫn xem giá gợi ý</h3>
                <p className="page-desc">
                  Tham khảo mức giá gợi ý cho từng loại phòng trong thời gian sắp tới để hỗ trợ ra quyết định nhanh
                  hơn. Bạn có thể xem theo từng ngày, từng loại phòng rồi chọn áp dụng hoặc giữ nguyên giá hiện tại.
                </p>
              </div>
              <div className="pricing-guide-grid">
                <div className="pricing-guide-item">
                  <span className="pricing-guide-item__step">1</span>
                  <div>
                    <strong>Chọn loại phòng (khách sạn chọn trên thanh phía trên)</strong>
                    <p>Xem riêng từng nhóm phòng để so sánh mức giá đang dùng với mức giá được gợi ý.</p>
                  </div>
                </div>
                <div className="pricing-guide-item">
                  <span className="pricing-guide-item__step">2</span>
                  <div>
                    <strong>Chọn khoảng thời gian muốn xem</strong>
                    <p>Xem ngắn ngày để điều chỉnh gần, hoặc xem dài hơn để chuẩn bị giá cho giai đoạn sắp tới.</p>
                  </div>
                </div>
                <div className="pricing-guide-item">
                  <span className="pricing-guide-item__step">3</span>
                  <div>
                    <strong>Xem biến động theo từng ngày</strong>
                    <p>Theo dõi gợi ý giá trong cả giai đoạn để biết ngày nào nên tăng, giữ hoặc giảm giá.</p>
                  </div>
                </div>
                <div className="pricing-guide-item">
                  <span className="pricing-guide-item__step">4</span>
                  <div>
                    <strong>Áp dụng theo từng ngày</strong>
                    <p>Nhấn <strong>Áp dụng</strong> trên dòng ngày bạn chọn để gán giá đề xuất đó cho mọi phòng cùng loại.</p>
                  </div>
                </div>
              </div>
            </div>
          </OwnerGuideCollapsible>
        </div>

        <PricingFilters
          roomTypes={roomTypes}
          selectedRoomType={selectedRoomType}
          onRoomTypeChange={setSelectedRoomType}
          days={days}
          onDaysChange={setDays}
          loading={loading || hotelsLoading}
          onRefresh={fetchPricing}
        />

        {(loading || hotelsLoading) && <div className="state-msg">Đang tải...</div>}
        {!loading && !hotelsLoading && error && <div className="state-msg state-msg--error">{error}</div>}
        {!loading && !hotelsLoading && !error && hotels.length === 0 && (
          <div className="state-msg">Bạn chưa có khách sạn để phân tích giá.</div>
        )}

        {!loading && !hotelsLoading && !error && hotels.length > 0 && note && (
          <div className="state-msg state-msg--warn">{note}</div>
        )}

        {!loading && !hotelsLoading && !error && hotels.length > 0 && block && !note && typeBlock && (
          <>
            {typeBlock.lastBulkApply && (
              <div className="pricing-history-banner" role="status">
                <strong>Lần áp dụng gợi ý gần nhất (loại {typeBlock.typeLabel})</strong>
                <p>
                  <time dateTime={typeBlock.lastBulkApply.lastBulkApplyAt}>
                    {formatDateTime(typeBlock.lastBulkApply.lastBulkApplyAt)}
                  </time>
                  {' — '}
                  {typeBlock.lastBulkApply.applyMode === 'day' && typeBlock.lastBulkApply.appliedDate ? (
                    <>
                      Áp dụng giá ngày <strong>{typeBlock.lastBulkApply.appliedDate}</strong>:{' '}
                    </>
                  ) : (
                    <>Áp dụng giá TB cả kỳ: </>
                  )}
                  TB giá đêm (price) trước khi áp dụng:{' '}
                  <strong>
                    {formatCurrency(typeBlock.lastBulkApply.previousAvgNightly)}
                  </strong>
                  , sau khi áp dụng:{' '}
                  <strong>
                    {formatCurrency(
                      typeBlock.lastBulkApply.appliedNightly ??
                        typeBlock.lastBulkApply.appliedAvgNightly
                    )}
                  </strong>
                  {(() => {
                    const lb = typeBlock.lastBulkApply;
                    const a =
                      (lb.appliedNightly ?? lb.appliedAvgNightly) ?? 0;
                    const p = lb.previousAvgNightly ?? 0;
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
                className="btn-apply-suggested btn-apply-suggested--secondary"
                onClick={() =>
                  openApplyModal({
                    mode: 'average',
                    price: avgSuggestedForRange,
                  })
                }
                disabled={loading || !daily.length || applyLoading}
              >
                Áp dụng TB cả kỳ (tùy chọn)
              </button>
              <span className="apply-row-hint">
                Khuyến nghị: dùng nút <strong>Áp dụng</strong> trong cột Thao tác (cạnh Xem chi tiết) để gán đúng giá đề xuất
                của <strong>từng ngày</strong> cho mọi phòng <strong>{typeBlock.typeLabel}</strong>.
                Giảm giá khuyến mãi do SalePromotion xử lý riêng khi khách đặt phòng.
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

            <PricingDailyTable
              typeLabel={typeBlock.typeLabel}
              daily={daily}
              onApplyDay={(row) =>
                openApplyModal({
                  mode: 'day',
                  date: row.date,
                  weekdayLabel: row.weekdayLabel,
                  price: row.suggestedNightly,
                })
              }
              applyingDate={applyLoading && applyTarget?.mode === 'day' ? applyTarget.date : null}
              applyDisabled={loading || applyLoading}
            />
          </>
        )}

        {applyModalOpen && typeBlock && applyTarget && (
          <div
            className="apply-modal-overlay"
            role="presentation"
            onClick={closeApplyModal}
          >
            <div
              className="apply-modal"
              role="dialog"
              aria-labelledby="apply-modal-title"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="apply-modal-title">Xác nhận áp dụng giá gợi ý</h3>
              {applyTarget.mode === 'day' ? (
                <p>
                  Bạn sắp gán <strong>giá đêm</strong> cho{' '}
                  <strong>tất cả phòng đang hoạt động</strong> loại <strong>{typeBlock.typeLabel}</strong>{' '}
                  tại khách sạn đang chọn, bằng{' '}
                  <strong>{formatCurrency(applyTarget.price)}</strong> — giá đề xuất của ngày{' '}
                  <strong>
                    {applyTarget.weekdayLabel} {applyTarget.date}
                  </strong>
                  .
                </p>
              ) : (
                <p>
                  Bạn sắp gán <strong>giá đêm</strong> cho{' '}
                  <strong>tất cả phòng đang hoạt động</strong> loại <strong>{typeBlock.typeLabel}</strong>{' '}
                  tại khách sạn đang chọn, bằng{' '}
                  <strong>{formatCurrency(applyTarget.price)}</strong> — trung bình giá đề xuất trong{' '}
                  <strong>{days} ngày</strong> tới (theo bộ lọc hiện tại).
                </p>
              )}
              <p className="apply-modal-note">
                Bạn vẫn có thể chỉnh riêng từng phòng sau tại{' '}
                <strong>sơ đồ phòng</strong>. Khuyến mãi theo chương trình sale không bị ảnh hưởng.
              </p>
              <div className="apply-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  disabled={applyLoading}
                  onClick={closeApplyModal}
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
