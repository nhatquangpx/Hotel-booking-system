import { formatCurrency } from '@/shared/utils/format';
import {
  getGuestSalePricingSummary,
  formatNightBreakdownLine,
} from '@/shared/utils/salePricingDisplay';
import './GuestSalePricingBreakdown.scss';

/**
 * Giải thích giá sale cho guest (danh sách phòng, modal, trang thanh toán).
 * @param {'compact'|'full'} variant
 */
const GuestSalePricingBreakdown = ({ pricing, variant = 'full', className = '' }) => {
  const summary = getGuestSalePricingSummary(pricing);
  if (!summary) return null;

  const { mainMessage, periodLines, mixedSalePricing, nightBreakdown, nights } = summary;
  const showNights = variant === 'full' && nightBreakdown.length > 0 && nightBreakdown.length <= 14;

  return (
    <div
      className={`guest-sale-pricing ${variant === 'compact' ? 'guest-sale-pricing--compact' : ''} ${className}`.trim()}
      role="note"
    >
      {mixedSalePricing && (
        <p className="guest-sale-pricing__badge">Giá từng đêm khác nhau trong kỳ lưu trú</p>
      )}
      <p className="guest-sale-pricing__main">{mainMessage}</p>
      {periodLines.length > 0 && (
        <ul className="guest-sale-pricing__periods">
          {periodLines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
      {variant === 'full' && pricing.basePrice != null && (
        <p className="guest-sale-pricing__totals">
          Tạm tính {nights} đêm: {formatCurrency(pricing.basePrice)}
          {pricing.discountAmount > 0 && (
            <>
              {' '}
              − giảm {formatCurrency(pricing.discountAmount)} ={' '}
              <strong>{formatCurrency(pricing.finalAmount)}</strong>
            </>
          )}
        </p>
      )}
      {showNights && (
        <div className="guest-sale-pricing__nights">
          <p className="guest-sale-pricing__nights-title">Chi tiết từng đêm lưu trú</p>
          <ul>
            {nightBreakdown.map((night) => (
              <li key={night.date}>{formatNightBreakdownLine(night)}</li>
            ))}
          </ul>
        </div>
      )}
      {variant === 'full' && nightBreakdown.length > 14 && (
        <p className="guest-sale-pricing__hint">
          Đơn dài ({nightBreakdown.length} đêm): tổng tiền đã cộng đủ từng đêm theo quy tắc trên.
        </p>
      )}
    </div>
  );
};

export default GuestSalePricingBreakdown;
