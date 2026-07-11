import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import {
  filterOwnerPaymentQueue,
  filterOwnerRefundQueue,
  filterOwnerCheckInOutQueue,
  getOwnerActionCounts,
} from '@/shared/utils';
import OwnerBookingCard from './OwnerBookingCard';

const DEFAULT_PAYMENT_FILTERS = { search: '', method: 'all', proof: 'all' };
const DEFAULT_REFUND_FILTERS = { search: '', method: 'all' };
const DEFAULT_CHECK_IN_OUT_FILTERS = { search: '', type: 'all' };

const OwnerBookingSection = ({
  title,
  count,
  tone = 'default',
  filters,
  onFiltersChange,
  filterFields,
  bookings,
  emptyText,
  renderCard,
}) => (
  <section className={`booking-action-section booking-action-section--${tone}`}>
    <div className="booking-action-section__head">
      <h3 className="booking-action-section__title">
        {title}
        <span className="booking-action-section__count">{count}</span>
      </h3>
    </div>

    <div className="booking-action-section__filters">{filterFields(filters, onFiltersChange)}</div>

    {bookings.length === 0 ? (
      <p className="booking-action-section__empty">{emptyText}</p>
    ) : (
      <div className="booking-cards booking-action-section__cards">
        {bookings.map((booking) => renderCard(booking))}
      </div>
    )}
  </section>
);

const SectionSearch = ({ id, value, onChange, placeholder }) => (
  <div className="booking-action-filter booking-action-filter--search">
    <label htmlFor={id} className="sr-only">
      Tìm kiếm
    </label>
    <FaSearch className="booking-action-filter__icon" aria-hidden />
    <input
      id={id}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const OwnerBookingActionSections = ({
  hotelId,
  bookings,
  getBookingSource,
  cardHandlers,
}) => {
  const [paymentFilters, setPaymentFilters] = useState(DEFAULT_PAYMENT_FILTERS);
  const [refundFilters, setRefundFilters] = useState(DEFAULT_REFUND_FILTERS);
  const [checkInOutFilters, setCheckInOutFilters] = useState(DEFAULT_CHECK_IN_OUT_FILTERS);

  useEffect(() => {
    setPaymentFilters(DEFAULT_PAYMENT_FILTERS);
    setRefundFilters(DEFAULT_REFUND_FILTERS);
    setCheckInOutFilters(DEFAULT_CHECK_IN_OUT_FILTERS);
  }, [hotelId]);

  const counts = getOwnerActionCounts(bookings);

  const paymentBookings = filterOwnerPaymentQueue(bookings, paymentFilters);
  const refundBookings = filterOwnerRefundQueue(bookings, refundFilters);
  const checkInOutBookings = filterOwnerCheckInOutQueue(bookings, checkInOutFilters);

  const renderCard = (booking) => (
    <OwnerBookingCard
      key={booking._id}
      booking={booking}
      source={getBookingSource(booking)}
      highlightAction
      onOpenDetail={cardHandlers.onOpenDetail}
      onOpenConfirm={cardHandlers.onOpenConfirm}
      onOpenCheckIn={cardHandlers.onOpenCheckIn}
      onOpenCheckOut={cardHandlers.onOpenCheckOut}
      onOpenRefund={cardHandlers.onOpenRefund}
      onOpenReject={cardHandlers.onOpenReject}
      onOpenReopen={cardHandlers.onOpenReopen}
      onPreviewProof={cardHandlers.onPreviewProof}
    />
  );

  const updatePaymentFilters = (patch) =>
    setPaymentFilters((prev) => ({ ...prev, ...patch }));
  const updateRefundFilters = (patch) =>
    setRefundFilters((prev) => ({ ...prev, ...patch }));
  const updateCheckInOutFilters = (patch) =>
    setCheckInOutFilters((prev) => ({ ...prev, ...patch }));

  return (
    <div className="booking-action-sections">
      <OwnerBookingSection
        title="Chờ xác nhận thanh toán"
        count={counts.paymentTotal}
        tone="payment"
        filters={paymentFilters}
        onFiltersChange={updatePaymentFilters}
        bookings={paymentBookings}
        emptyText="Không có đơn chờ xác nhận thanh toán phù hợp bộ lọc."
        renderCard={renderCard}
        filterFields={(filters, onChange) => (
          <>
            <SectionSearch
              id="owner-payment-search"
              value={filters.search}
              onChange={(search) => onChange({ search })}
              placeholder="Tìm tên, SĐT, mã đơn, phòng..."
            />
            <div className="booking-action-filter">
              <label htmlFor="owner-payment-method">Phương thức</label>
              <select
                id="owner-payment-method"
                value={filters.method}
                onChange={(e) => onChange({ method: e.target.value })}
              >
                <option value="all">Tất cả</option>
                <option value="qr_code">QR chuyển khoản</option>
                <option value="vnpay">VNPay</option>
              </select>
            </div>
            <div className="booking-action-filter">
              <label htmlFor="owner-payment-proof">Minh chứng QR</label>
              <select
                id="owner-payment-proof"
                value={filters.proof}
                onChange={(e) => onChange({ proof: e.target.value })}
              >
                <option value="all">Tất cả</option>
                <option value="proof_submitted">Đã gửi minh chứng</option>
                <option value="proof_missing">Chưa gửi minh chứng</option>
              </select>
            </div>
          </>
        )}
      />

      <OwnerBookingSection
        title="Chờ hoàn tiền"
        count={counts.refund}
        tone="refund"
        filters={refundFilters}
        onFiltersChange={updateRefundFilters}
        bookings={refundBookings}
        emptyText="Không có đơn chờ hoàn tiền phù hợp bộ lọc."
        renderCard={renderCard}
        filterFields={(filters, onChange) => (
          <>
            <SectionSearch
              id="owner-refund-search"
              value={filters.search}
              onChange={(search) => onChange({ search })}
              placeholder="Tìm tên, SĐT, mã đơn, phòng..."
            />
            <div className="booking-action-filter">
              <label htmlFor="owner-refund-method">Phương thức đã thanh toán</label>
              <select
                id="owner-refund-method"
                value={filters.method}
                onChange={(e) => onChange({ method: e.target.value })}
              >
                <option value="all">Tất cả</option>
                <option value="qr_code">QR chuyển khoản</option>
                <option value="vnpay">VNPay</option>
              </select>
            </div>
          </>
        )}
      />

      <OwnerBookingSection
        title="Check-in / Check-out (hôm nay & quá hạn)"
        count={counts.checkInOut}
        tone="checkinout"
        filters={checkInOutFilters}
        onFiltersChange={updateCheckInOutFilters}
        bookings={checkInOutBookings}
        emptyText="Không có đơn check-in hoặc check-out cần xử lý phù hợp bộ lọc."
        renderCard={renderCard}
        filterFields={(filters, onChange) => (
          <>
            <SectionSearch
              id="owner-checkinout-search"
              value={filters.search}
              onChange={(search) => onChange({ search })}
              placeholder="Tìm tên, SĐT, mã đơn, phòng..."
            />
            <div className="booking-action-filter">
              <label htmlFor="owner-checkinout-type">Loại</label>
              <select
                id="owner-checkinout-type"
                value={filters.type}
                onChange={(e) => onChange({ type: e.target.value })}
              >
                <option value="all">Tất cả</option>
                <option value="checkin">Chỉ check-in</option>
                <option value="checkout">Check-out (hôm nay & quá hạn)</option>
                <option value="overstay">Chỉ check-out quá hạn</option>
              </select>
            </div>
          </>
        )}
      />
    </div>
  );
};

export default OwnerBookingActionSections;
