import { formatDate, formatCurrency } from '../core/format';

/** YYYY-MM-DD → dd/mm/yyyy */
export function formatSaleDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '';
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

/**
 * @param {object} pricing — salePricing hoặc pricePreview từ API guest
 */
export function getGuestSalePricingSummary(pricing) {
  if (!pricing || !(pricing.discountAmount > 0)) {
    return null;
  }

  const {
    salePeriods = [],
    nightsOnSale = 0,
    nightsRegularPrice = 0,
    mixedSalePricing = false,
    nights = 0,
    nightBreakdown = [],
  } = pricing;

  const periods = salePeriods.map((p) => ({
    title: p.title,
    range: formatSaleDateRange(p.startDate, p.endDate),
    percent: p.discountPercent,
    nightsApplied: p.nightsApplied,
  }));

  let mainMessage = '';
  if (mixedSalePricing) {
    mainMessage = `Kỳ lưu trú ${nights} đêm: ${nightsOnSale} đêm được giảm theo chương trình khuyến mãi, ${nightsRegularPrice} đêm tính giá gốc (đêm nằm ngoài khoảng ngày sale hoặc không có khuyến mãi).`;
  } else if (periods.length === 1) {
    const p = periods[0];
    mainMessage = `Giảm ${p.percent}% cho toàn bộ ${nightsOnSale} đêm — chương trình «${p.title}» áp dụng các đêm lưu trú từ ${p.range}.`;
  } else if (periods.length > 1) {
    mainMessage = `Có ${periods.length} chương trình trong kỳ đặt phòng; mỗi đêm hệ thống áp mức giảm cao nhất (${nightsOnSale} đêm được giảm).`;
  } else if (nightsOnSale > 0) {
    mainMessage = `${nightsOnSale} đêm trong kỳ được giảm giá.`;
  }

  const periodLines = periods.map((p) =>
    `«${p.title}»: giảm ${p.percent}% cho đêm lưu trú trong ${p.range} — ${p.nightsApplied} đêm trong đơn của bạn.`
  );

  return {
    mainMessage,
    periodLines,
    mixedSalePricing,
    nightsOnSale,
    nightsRegularPrice,
    nightBreakdown,
    periods,
    nights,
  };
}

export function formatNightBreakdownLine(night) {
  const dateLabel = formatDate(night.date);
  if (night.onSale) {
    const range =
      night.saleStartDate && night.saleEndDate
        ? formatSaleDateRange(night.saleStartDate, night.saleEndDate)
        : '';
    const promo =
      night.saleTitle && range
        ? ` («${night.saleTitle}», ${range})`
        : night.saleTitle
          ? ` («${night.saleTitle}»)`
          : '';
    return `${dateLabel}: ${formatCurrency(night.finalNightly)}/đêm (giảm ${night.discountPercent}%${promo})`;
  }
  return `${dateLabel}: ${formatCurrency(night.nightlyBase)}/đêm — giá gốc, không áp khuyến mãi`;
}
