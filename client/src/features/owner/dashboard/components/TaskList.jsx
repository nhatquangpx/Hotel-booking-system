import React, { useMemo } from 'react';
import {
  FaExclamationCircle,
  FaCheckCircle,
  FaWrench,
  FaClipboardList,
} from 'react-icons/fa';
import DashboardPanel from '@/features/staff/dashboard/components/DashboardPanel';
import { PAGE_SIZE } from '@/constants/pagination';
import './TaskList.scss';

const getTaskLeading = (type) => {
  switch (type) {
    case 'urgent':
    case 'maintenance':
    case 'equipment_broken':
      return <FaExclamationCircle className="staff-dash-warning" aria-hidden />;
    case 'equipment_under_repair':
      return <FaWrench className="owner-task-icon owner-task-icon--repair" aria-hidden />;
    case 'checkin':
    case 'checkout':
      return <FaCheckCircle className="staff-dash-check staff-dash-check--done" aria-hidden />;
    default:
      return <FaExclamationCircle className="staff-dash-warning" aria-hidden />;
  }
};

/**
 * Công việc hôm nay — phân trang client (2 cột, 10 mục/trang).
 */
const TaskList = ({ tasks = [] }) => {
  const items = useMemo(
    () =>
      tasks.map((task) => ({
        id: task.id || task.text,
        linkTo: task.linkTo,
        leading: getTaskLeading(task.type),
        main: (
          <>
            {task.urgent && (
              <span className="staff-dash-badge staff-dash-badge--task-urgent">Gấp</span>
            )}{' '}
            {task.text}
          </>
        ),
        meta: task.time || null,
      })),
    [tasks]
  );

  const urgentCount = tasks.filter((t) => t.urgent).length;
  const subtitle =
    tasks.length === 0
      ? undefined
      : urgentCount > 0
        ? `${urgentCount} việc gấp · ${tasks.length} tổng`
        : `${tasks.length} việc`;

  return (
    <DashboardPanel
      icon={FaClipboardList}
      title="Công việc hôm nay"
      subtitle={subtitle}
      items={items}
      emptyText="Không có công việc nào hôm nay"
      pageSize={PAGE_SIZE.DASHBOARD_TASKS_TWO_COLUMN}
      listLayout="two-column"
      className="owner-dashboard-tasks"
    />
  );
};

export default TaskList;
