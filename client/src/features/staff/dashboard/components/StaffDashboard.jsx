import React from 'react';
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
import DashboardPanel from './DashboardPanel';
import './StaffDashboard.scss';

/** Dữ liệu mẫu — thay bằng API staff dashboard sau */
const MOCK_STATS = {
  availableRooms: 12,
  equipmentAttentionCount: 2,
  checkInToday: 5,
  checkOutToday: 7,
  reviewsAwaitingReply: 1,
};

const MOCK_TASKS = [
  {
    id: 't1',
    type: 'checkin',
    guest: 'Nguyễn Văn A',
    room: '201',
    time: '14:00',
    done: false,
  },
  {
    id: 't2',
    type: 'checkout',
    guest: 'Trần Thị B',
    room: '305',
    time: '11:00',
    done: true,
  },
  {
    id: 't3',
    type: 'checkin',
    guest: 'Lê Minh C',
    room: '102',
    time: '15:30',
    done: false,
  },
];

const MOCK_ROOMS = [
  { id: 'r1', number: '201', status: 'waiting', label: 'Chờ dọn' },
  { id: 'r2', number: '305', status: 'cleaning', label: 'Đang dọn' },
  { id: 'r3', number: '102', status: 'ready', label: 'Sẵn sàng' },
];

const MOCK_EQUIPMENT = [
  {
    id: 'e1',
    name: 'Điều hòa',
    room: '201',
    issue: 'Không mát',
    time: '09:15',
    status: 'pending',
    statusLabel: 'Chờ xử lý',
  },
  {
    id: 'e2',
    name: 'TV',
    room: '305',
    issue: 'Không bật được',
    time: '10:40',
    status: 'progress',
    statusLabel: 'Đang sửa',
  },
];

const MOCK_REVIEWS = [
  {
    id: 'rv1',
    guest: 'Phạm Thu D',
    rating: 5,
    comment: 'Phòng sạch, nhân viên thân thiện.',
    time: 'Hôm qua',
    replied: false,
  },
  {
    id: 'rv2',
    guest: 'Hoàng Văn E',
    rating: 4,
    comment: 'Vị trí thuận tiện, wifi hơi chậm.',
    time: '2 ngày trước',
    replied: true,
  },
];

const taskBadgeClass = (type) =>
  type === 'checkin' ? 'staff-dash-badge--checkin' : 'staff-dash-badge--checkout';

const roomBadgeClass = (status) => {
  if (status === 'waiting') return 'staff-dash-badge--waiting';
  if (status === 'cleaning') return 'staff-dash-badge--cleaning';
  return 'staff-dash-badge--ready';
};

const equipBadgeClass = (status) =>
  status === 'pending'
    ? 'staff-dash-badge--repair-pending'
    : 'staff-dash-badge--repair-progress';

/**
 * Staff Dashboard — metric + 4 panel (theo mock ảnh tham khảo)
 */
export const StaffDashboard = () => {
  const stats = MOCK_STATS;
  const unfinishedTasks = MOCK_TASKS.filter((t) => !t.done).length;
  const waitingRooms = MOCK_ROOMS.filter((r) => r.status === 'waiting').length;
  const newEquipment = MOCK_EQUIPMENT.filter((e) => e.status === 'pending').length;
  const unrepliedReviews = MOCK_REVIEWS.filter((r) => !r.replied).length;

  const taskItems = MOCK_TASKS.map((task) => ({
    id: task.id,
    linkTo: '/staff/bookings',
    leading: (
      <span
        className={`staff-dash-check${task.done ? ' staff-dash-check--done' : ''}`}
        aria-hidden
      >
        {task.done && <FaCheckCircle />}
      </span>
    ),
    main: (
      <>
        <span className={`staff-dash-badge ${taskBadgeClass(task.type)}`}>
          {task.type === 'checkin' ? 'Check-in' : 'Check-out'}
        </span>{' '}
        {task.guest} — Phòng {task.room}
      </>
    ),
    meta: task.time,
  }));

  const roomItems = MOCK_ROOMS.map((room) => ({
    id: room.id,
    linkTo: '/staff/rooms',
    main: `Phòng ${room.number}`,
    trailing: (
      <span className={`staff-dash-badge ${roomBadgeClass(room.status)}`}>
        {room.label}
      </span>
    ),
  }));

  const equipmentItems = MOCK_EQUIPMENT.map((eq) => ({
    id: eq.id,
    linkTo: '/staff/equipment',
    leading: <FaExclamationTriangle className="staff-dash-warning" aria-hidden />,
    main: `${eq.name} — Phòng ${eq.room}`,
    meta: `${eq.issue} · ${eq.time}`,
    trailing: (
      <span className={`staff-dash-badge ${equipBadgeClass(eq.status)}`}>
        {eq.statusLabel}
      </span>
    ),
  }));

  const reviewItems = MOCK_REVIEWS.map((rv) => ({
    id: rv.id,
    linkTo: '/staff/reviews',
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
        {rv.comment}
        <br />
        {rv.time}
      </>
    ),
    trailing: rv.replied ? (
      <span className="staff-dash-badge staff-dash-badge--replied">Đã trả lời</span>
    ) : (
      <span className="staff-dash-badge staff-dash-badge--waiting">Chưa trả lời</span>
    ),
  }));

  return (
    <div className="staff-dashboard">
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
        <DashboardPanel
          icon={FaClock}
          title="Nhiệm vụ hôm nay"
          subtitle={`${unfinishedTasks} chưa xong`}
          items={taskItems}
          viewAllTo="/staff/bookings"
        />
        <DashboardPanel
          icon={FaBed}
          title="Trạng thái phòng"
          subtitle={`${waitingRooms} chờ dọn`}
          items={roomItems}
          viewAllTo="/staff/rooms"
        />
        <DashboardPanel
          icon={FaWrench}
          title="Thiết bị cần xử lý"
          subtitle={`${newEquipment} mới`}
          items={equipmentItems}
          viewAllTo="/staff/equipment"
        />
        <DashboardPanel
          icon={FaCommentDots}
          title="Review cần phản hồi"
          subtitle={`${unrepliedReviews} chưa trả lời`}
          items={reviewItems}
          viewAllTo="/staff/reviews"
        />
      </div>
    </div>
  );
};

export default StaffDashboard;
