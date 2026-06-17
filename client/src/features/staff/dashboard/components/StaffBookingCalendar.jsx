import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ROUTES } from '@/constants/routes';
import { useStaffHotel } from '@/features/staff/context/StaffHotelContext';
import { staffBookingAPI } from '@/apis/staff/booking';
import {
  addDays,
  addMonths,
  formatFullDate,
  formatMonthYear,
  formatWeekRange,
  formatYmd,
  getMonthGrid,
  getWeekDays,
  getWeekdayLabel,
  isSameCalendarDay,
  isToday,
  WEEKDAY_LABELS,
} from '../utils/calendarDate';
import {
  buildDaySummaryMap,
  filterCalendarBookings,
  formatDayEvent,
  formatDaySummaryLabel,
  getDayBookingRows,
  getDaySummary,
  getStaffBookingDisplayStatus,
} from '../utils/bookingCalendar';
import './StaffBookingCalendar.scss';
import { useStaffBookingCalendarSocket } from '../hooks/useStaffBookingCalendarSocket';

const VIEW_MODES = {
  week: 'week',
  month: 'month',
};

const LEGEND_ITEMS = [
  { key: 'checkin', label: 'Check-in', code: 'CI', hint: 'Khách đến nhận phòng' },
  { key: 'checkout', label: 'Check-out', code: 'CO', hint: 'Khách trả phòng rời đi' },
];

const EVENT_TITLES = {
  checkin: 'Check-in',
  checkout: 'Check-out',
};

const BOOKING_GROUPS = [
  { key: 'checkin', title: 'Check-in' },
  { key: 'checkout', title: 'Check-out' },
];

const StaffBookingCalendar = () => {
  const navigate = useNavigate();
  const { hotelId, loading: hotelLoading } = useStaffHotel();
  const [viewMode, setViewMode] = useState(VIEW_MODES.week);
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    if (hotelLoading || !hotelId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await staffBookingAPI.getBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setBookings([]);
      setError(err.message || 'Không thể tải lịch đặt phòng');
    } finally {
      setLoading(false);
    }
  }, [hotelId, hotelLoading]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useStaffBookingCalendarSocket(fetchBookings, Boolean(hotelId) && !hotelLoading);

  const calendarBookings = useMemo(() => filterCalendarBookings(bookings), [bookings]);

  const weekDays = useMemo(() => getWeekDays(anchorDate), [anchorDate]);
  const monthDays = useMemo(() => getMonthGrid(anchorDate), [anchorDate]);
  const visibleDays = viewMode === VIEW_MODES.week ? weekDays : monthDays;
  const daySummaryMap = useMemo(
    () => buildDaySummaryMap(calendarBookings, visibleDays),
    [calendarBookings, visibleDays]
  );

  const selectedRows = useMemo(
    () => (selectedDay ? getDayBookingRows(calendarBookings, selectedDay) : []),
    [calendarBookings, selectedDay]
  );

  const groupedRows = useMemo(
    () =>
      BOOKING_GROUPS.map((group) => ({
        ...group,
        rows: selectedRows.filter((row) => row.eventType === group.key),
      })).filter((group) => group.rows.length > 0),
    [selectedRows]
  );

  const selectedSummary = useMemo(
    () => (selectedDay ? getDaySummary(calendarBookings, selectedDay) : null),
    [calendarBookings, selectedDay]
  );

  const headerLabel =
    viewMode === VIEW_MODES.week ? formatWeekRange(weekDays) : formatMonthYear(anchorDate);

  const goPrev = () => {
    setAnchorDate((prev) =>
      viewMode === VIEW_MODES.week ? addDays(prev, -7) : addMonths(prev, -1)
    );
  };

  const goNext = () => {
    setAnchorDate((prev) =>
      viewMode === VIEW_MODES.week ? addDays(prev, 7) : addMonths(prev, 1)
    );
  };

  const goToday = () => {
    const today = new Date();
    setAnchorDate(today);
    setSelectedDay(today);
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  const handleBookingClick = (bookingId) => {
    navigate(`${ROUTES.STAFF_BOOKINGS}?bookingId=${bookingId}`);
  };

  const renderEventIndicators = (summary, compact = false) => {
    if (!summary?.total) return null;

    const items = [
      { key: 'checkin', count: summary.checkin },
      { key: 'checkout', count: summary.checkout },
    ].filter((item) => item.count > 0);

    return (
      <div
        className={[
          'staff-booking-calendar__events',
          compact ? 'staff-booking-calendar__events--compact' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden
      >
        {items.map((item) => (
          <span
            key={item.key}
            className={`staff-booking-calendar__event staff-booking-calendar__event--${item.key}`}
            title={`${item.count} ${EVENT_TITLES[item.key]}`}
          >
            {!compact && <span className="staff-booking-calendar__event-count">{item.count}</span>}
          </span>
        ))}
      </div>
    );
  };

  const renderDayCell = (day) => {
    const key = day.toISOString();
    const ymd = formatYmd(day);
    const summary = daySummaryMap[ymd] ?? { total: 0, checkin: 0, checkout: 0 };
    const isCurrentMonth = day.getMonth() === anchorDate.getMonth();
    const selected = selectedDay && isSameCalendarDay(day, selectedDay);
    const today = isToday(day);
    const isWeekView = viewMode === VIEW_MODES.week;

    return (
      <button
        key={key}
        type="button"
        className={[
          'staff-booking-calendar__day',
          !isCurrentMonth && viewMode === VIEW_MODES.month
            ? 'staff-booking-calendar__day--outside'
            : '',
          today ? 'staff-booking-calendar__day--today' : '',
          selected ? 'staff-booking-calendar__day--selected' : '',
          summary.total > 0 ? 'staff-booking-calendar__day--has-bookings' : '',
          isWeekView ? 'staff-booking-calendar__day--week' : 'staff-booking-calendar__day--month',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => handleDayClick(day)}
        aria-pressed={selected}
        aria-label={`${getWeekdayLabel(day, true)} ${day.getDate()}/${day.getMonth() + 1}, ${formatDaySummaryLabel(summary)}`}
      >
        <span className="staff-booking-calendar__day-top">
          {isWeekView && (
            <span className="staff-booking-calendar__day-weekday">{getWeekdayLabel(day)}</span>
          )}
          <span className="staff-booking-calendar__day-number">{day.getDate()}</span>
        </span>

        {summary.total > 0 ? (
          <>
            {renderEventIndicators(summary, !isWeekView)}
            <span className="staff-booking-calendar__day-total">
              {formatDaySummaryLabel(summary)}
            </span>
          </>
        ) : (
          <span className="staff-booking-calendar__day-empty">—</span>
        )}
      </button>
    );
  };

  return (
    <section className="staff-booking-calendar" aria-label="Lịch đặt phòng">
      <header className="staff-booking-calendar__header">
        <div className="staff-booking-calendar__title-row">
          <span className="staff-booking-calendar__icon" aria-hidden>
            <FaCalendarAlt />
          </span>
          <div>
            <h2 className="staff-booking-calendar__title">Lịch đặt phòng</h2>
            <p className="staff-booking-calendar__period">{headerLabel}</p>
          </div>
        </div>

        <div className="staff-booking-calendar__controls">
          <div className="staff-booking-calendar__view-toggle" role="group" aria-label="Chế độ xem">
            <button
              type="button"
              className={viewMode === VIEW_MODES.week ? 'is-active' : ''}
              onClick={() => setViewMode(VIEW_MODES.week)}
            >
              Tuần
            </button>
            <button
              type="button"
              className={viewMode === VIEW_MODES.month ? 'is-active' : ''}
              onClick={() => setViewMode(VIEW_MODES.month)}
            >
              Tháng
            </button>
          </div>

          <div className="staff-booking-calendar__nav">
            <button type="button" onClick={goPrev} aria-label="Kỳ trước">
              <FaChevronLeft />
            </button>
            <button type="button" className="staff-booking-calendar__today" onClick={goToday}>
              Hôm nay
            </button>
            <button type="button" onClick={goNext} aria-label="Kỳ sau">
              <FaChevronRight />
            </button>
          </div>
        </div>
      </header>

      <div className="staff-booking-calendar__legend" aria-label="Chú thích">
        <span className="staff-booking-calendar__legend-title">Chú thích</span>
        <div className="staff-booking-calendar__legend-body">
          <ul className="staff-booking-calendar__legend-list">
            {LEGEND_ITEMS.map(({ key, label, code, hint }) => (
              <li key={key} className="staff-booking-calendar__legend-item">
                <span
                  className={`staff-booking-calendar__event staff-booking-calendar__event--${key} staff-booking-calendar__event--dot`}
                  aria-hidden
                />
                <span className="staff-booking-calendar__legend-text">
                  <strong>
                    {label} ({code})
                  </strong>
                  <span>{hint}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {error && <div className="staff-booking-calendar__error">{error}</div>}

      {loading ? (
        <div className="staff-booking-calendar__loading">Đang tải lịch...</div>
      ) : (
        <div className="staff-booking-calendar__body">
          <div
            className={[
              'staff-booking-calendar__grid-wrap',
              viewMode === VIEW_MODES.week
                ? 'staff-booking-calendar__grid-wrap--week'
                : 'staff-booking-calendar__grid-wrap--month',
            ].join(' ')}
          >
            {viewMode === VIEW_MODES.month && (
              <div className="staff-booking-calendar__weekdays" aria-hidden>
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label} className="staff-booking-calendar__weekday">
                    {label}
                  </span>
                ))}
              </div>
            )}

            <div
              className={[
                'staff-booking-calendar__days',
                viewMode === VIEW_MODES.week
                  ? 'staff-booking-calendar__days--week'
                  : 'staff-booking-calendar__days--month',
              ].join(' ')}
            >
              {visibleDays.map((day) => renderDayCell(day))}
            </div>
          </div>

          <aside className="staff-booking-calendar__detail">
            <div className="staff-booking-calendar__detail-header">
              <h3 className="staff-booking-calendar__detail-title">
                {selectedDay ? formatFullDate(selectedDay) : 'Chọn một ngày'}
              </h3>
              {selectedSummary && selectedSummary.total > 0 && (
                <div className="staff-booking-calendar__detail-stats">
                  <span className="staff-booking-calendar__stat">
                    Tổng <strong>{selectedSummary.total}</strong> sự kiện
                  </span>
                  {selectedSummary.checkin > 0 && (
                    <span className="staff-booking-calendar__stat staff-booking-calendar__stat--checkin">
                      {selectedSummary.checkin} Check-in
                    </span>
                  )}
                  {selectedSummary.checkout > 0 && (
                    <span className="staff-booking-calendar__stat staff-booking-calendar__stat--checkout">
                      {selectedSummary.checkout} Check-out
                    </span>
                  )}
                </div>
              )}
            </div>

            {!selectedDay ? (
              <p className="staff-booking-calendar__detail-empty">
                Nhấn vào ngày trên lịch để xem đơn Check-in hoặc Check-out.
              </p>
            ) : selectedRows.length === 0 ? (
              <div className="staff-booking-calendar__detail-placeholder">
                <FaCalendarAlt aria-hidden />
                <p>Không có đơn Check-in hoặc Check-out trong ngày này.</p>
              </div>
            ) : (
              <div className="staff-booking-calendar__booking-groups">
                {groupedRows.map((group) => (
                  <section key={group.key} className="staff-booking-calendar__booking-group">
                    <h4
                      className={`staff-booking-calendar__group-title staff-booking-calendar__group-title--${group.key}`}
                    >
                      {group.title}
                      <span className="staff-booking-calendar__group-count">{group.rows.length}</span>
                    </h4>
                    <ul className="staff-booking-calendar__booking-list">
                      {group.rows.map((row) => {
                        const { booking, eventType, rowKey } = row;
                        const status = getStaffBookingDisplayStatus(booking);
                        const guestName = booking.guest?.name || 'Khách hàng';
                        const roomNo = booking.room?.roomNumber ?? '—';

                        return (
                          <li key={rowKey}>
                            <button
                              type="button"
                              className={`staff-booking-calendar__booking-item staff-booking-calendar__booking-item--${eventType}`}
                              onClick={() => handleBookingClick(booking._id)}
                            >
                              <span
                                className={`staff-booking-calendar__type-badge staff-booking-calendar__type-badge--${eventType}`}
                              >
                                {formatDayEvent(eventType)}
                              </span>
                              <div className="staff-booking-calendar__booking-main">
                                <span className="staff-booking-calendar__booking-room">
                                  Phòng <strong>{roomNo}</strong>
                                </span>
                                <span className="staff-booking-calendar__booking-guest">{guestName}</span>
                              </div>
                              <span
                                className={`staff-booking-calendar__status staff-booking-calendar__status--${status.tone}`}
                              >
                                {status.label}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
};

export default StaffBookingCalendar;
