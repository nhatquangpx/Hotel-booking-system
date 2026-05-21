import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaBed,
  FaWrench,
  FaUserCheck,
  FaSignOutAlt,
  FaCommentDots,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
} from 'react-icons/fa';
import MetricCard from '@/features/owner/components/MetricCard';
import { useStaffHotel } from '@/features/staff/context/StaffHotelContext';
import { staffDashboardAPI } from '@/apis/staff/dashboard';
import { formatDate } from '@/shared/utils';
import { getRoomMapDisplayStatus } from '@/features/staff/rooms/utils/roomMapDisplayStatus';
import DashboardPanel from './DashboardPanel';
import './StaffDashboard.scss';

const EMPTY_DASHBOARD = {
  stats: {
    availableRooms: 0,
    equipmentAttentionCount: 0,
    checkInToday: 0,
    checkOutToday: 0,
    reviewsAwaitingReply: 0,
  },
  tasks: [],
  rooms: [],
  equipment: [],
  reviews: [],
  panelMeta: {
    unfinishedTasks: 0,
    attentionRooms: 0,
    equipmentPendingCount: 0,
    equipmentUnderRepairCount: 0,
    unrepliedReviews: 0,
  },
};

const TASK_TYPE_LABELS = {
  checkin: 'Check-in',
  checkout: 'Check-out',
  maintenance: 'Bảo trì phòng',
  equipment_broken: 'Thiết bị hỏng',
};

const taskBadgeClass = (type) => {
  if (type === 'checkin') return 'staff-dash-badge--checkin';
  if (type === 'checkout') return 'staff-dash-badge--checkout';
  if (type === 'maintenance' || type === 'equipment_broken') return 'staff-dash-badge--task-urgent';
  return 'staff-dash-badge--checkout';
};

const truncateText = (text, maxLength = 120) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength).trim()}...`;
};

/** Màu badge khớp RoomCard (--empty, --occupied, …) */
const roomBadgeClass = (displayColor) =>
  `staff-dash-badge--room-${displayColor || 'empty'}`;

const equipBadgeClass = (status) =>
  status === 'pending'
    ? 'staff-dash-badge--repair-pending'
    : 'staff-dash-badge--repair-progress';

/**
 * Staff Dashboard — metric + 4 panel (dữ liệu API /staff/dashboard)
 */
export const StaffDashboard = () => {
  const { hotelId, loading: hotelLoading, error: hotelError } = useStaffHotel();
  const [data, setData] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (hotelLoading || !hotelId) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await staffDashboardAPI.getDashboard();
      setData(result || EMPTY_DASHBOARD);
    } catch (err) {
      setData(EMPTY_DASHBOARD);
      setError(err.message || 'Có lỗi xảy ra khi tải tổng quan');
    } finally {
      setLoading(false);
    }
  }, [hotelId, hotelLoading]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!hotelLoading && !hotelId) {
      setLoading(false);
      setData(EMPTY_DASHBOARD);
    }
  }, [hotelLoading, hotelId]);

  const { stats, tasks, rooms, equipment, reviews, panelMeta } = data;

  const taskItems = useMemo(
    () =>
      tasks.map((task) => {
        const isBookingTask = task.type === 'checkin' || task.type === 'checkout';
        const showCheck = isBookingTask && task.done;

        return {
          id: task.id,
          linkTo: task.linkTo || '/staff/bookings',
          leading: showCheck ? (
            <span className="staff-dash-check staff-dash-check--done" aria-hidden>
              <FaCheckCircle />
            </span>
          ) : task.urgent ? (
            <FaExclamationTriangle className="staff-dash-warning" aria-hidden />
          ) : isBookingTask ? (
            <span className="staff-dash-check" aria-hidden />
          ) : null,
          main: (
            <>
              <span className={`staff-dash-badge ${taskBadgeClass(task.type)}`}>
                {TASK_TYPE_LABELS[task.type] || task.type}
              </span>{' '}
              {task.text ? task.text : `${task.guest} — Phòng ${task.room}`}
            </>
          ),
          meta: task.meta ? truncateText(task.meta, 120) : task.time || null,
        };
      }),
    [tasks]
  );

  const roomItems = useMemo(
    () =>
      rooms.map((room) => {
        const display =
          room.displayColor != null
            ? room
            : getRoomMapDisplayStatus(room);
        const badgeLabel = display.secondaryLabel
          ? `${display.label} · ${display.secondaryLabel}`
          : display.label;

        return {
          id: room.id,
          linkTo: room.linkTo || '/staff/rooms',
          main: `Phòng ${room.number}`,
          trailing: (
            <span
              className={`staff-dash-badge ${roomBadgeClass(display.displayColor)}`}
            >
              {badgeLabel}
            </span>
          ),
        };
      }),
    [rooms]
  );

  const equipmentItems = useMemo(
    () =>
      equipment.map((eq) => ({
        id: eq.id,
        linkTo: eq.linkTo || '/staff/equipment',
        leading: <FaExclamationTriangle className="staff-dash-warning" aria-hidden />,
        main: `${eq.name} — Phòng ${eq.room}`,
        meta: eq.issue,
        trailing: (
          <span className={`staff-dash-badge ${equipBadgeClass(eq.status)}`}>
            {eq.statusLabel}
          </span>
        ),
      })),
    [equipment]
  );

  const reviewItems = useMemo(
    () =>
      reviews.map((rv) => ({
        id: rv.id,
        linkTo: rv.linkTo || '/staff/reviews',
        main: (
          <>
            <strong>{rv.guest}</strong>
            <span className="staff-dash-stars" aria-label={`${rv.rating} sao`}>
              {'★'.repeat(rv.rating)}
              {'☆'.repeat(5 - rv.rating)}
            </span>
          </>
        ),
        meta: (
          <>
            {truncateText(rv.comment, 120)}
            <br />
            {rv.time ? formatDate(rv.time) : ''}
          </>
        ),
        trailing: (
          <span className="staff-dash-badge staff-dash-badge--waiting">Chưa trả lời</span>
        ),
      })),
    [reviews]
  );

  const showNoHotel = !hotelLoading && !hotelId;
  const displayError = error || (!hotelLoading && hotelError);

  if (loading && hotelId) {
    return <div className="staff-dashboard staff-dashboard--loading">Đang tải...</div>;
  }

  return (
    <div className="staff-dashboard">
      {showNoHotel && (
        <div className="staff-dashboard__alert">{hotelError || 'Tài khoản chưa được gán khách sạn.'}</div>
      )}

      {displayError && hotelId && (
        <div className="staff-dashboard__alert staff-dashboard__alert--error">{displayError}</div>
      )}

      {hotelId && !displayError && (
        <>
          <div className="staff-dashboard__metrics metrics-grid">
            <MetricCard
              title="Phòng trống"
              value={stats.availableRooms}
              icon={FaBed}
              iconColor="blue"
              to="/staff/rooms"
            />
            <MetricCard
              title="Thiết bị cần xử lý"
              value={stats.equipmentAttentionCount}
              icon={FaWrench}
              iconColor="yellow"
              to="/staff/equipment"
            />
            <MetricCard
              title="Check-in hôm nay"
              value={stats.checkInToday}
              icon={FaUserCheck}
              iconColor="green"
              to="/staff/bookings"
            />
            <MetricCard
              title="Check-out hôm nay"
              value={stats.checkOutToday}
              icon={FaSignOutAlt}
              iconColor="default"
              to="/staff/bookings"
            />
            <MetricCard
              title="Đánh giá chưa phản hồi"
              value={stats.reviewsAwaitingReply}
              icon={FaCommentDots}
              iconColor="red"
              to="/staff/reviews"
            />
          </div>

          <div className="staff-dashboard__panels">
            <div className="staff-dashboard__panels-tasks">
              <DashboardPanel
                icon={FaClock}
                title="Nhiệm vụ hôm nay"
                subtitle={`${panelMeta.unfinishedTasks} chưa xong`}
                items={taskItems}
                emptyText="Không có nhiệm vụ hôm nay"
                collapsibleLimit={12}
                listLayout="two-column"
              />
            </div>
            <div className="staff-dashboard__panels-bottom">
              <DashboardPanel
                icon={FaBed}
                title="Trạng thái phòng"
                subtitle={`${panelMeta.attentionRooms ?? 0} cần chú ý`}
                items={roomItems}
                emptyText="Tất cả phòng đang ổn định"
                viewAllTo="/staff/rooms"
              />
              <DashboardPanel
                icon={FaWrench}
                title="Thiết bị cần xử lý"
                subtitle={`${panelMeta.equipmentPendingCount ?? 0} chờ xử lý${
                  panelMeta.equipmentUnderRepairCount
                    ? ` · ${panelMeta.equipmentUnderRepairCount} đang sửa`
                    : ''
                }`}
                items={equipmentItems}
                emptyText="Không có thiết bị cần xử lý"
                viewAllTo="/staff/equipment"
              />
              <DashboardPanel
                icon={FaCommentDots}
                title="Review cần phản hồi"
                subtitle={`${stats.reviewsAwaitingReply} chưa trả lời`}
                items={reviewItems}
                emptyText="Không có đánh giá chờ phản hồi"
                viewAllTo="/staff/reviews"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StaffDashboard;
