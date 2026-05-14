import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationCircle, FaCheckCircle, FaWrench } from 'react-icons/fa';
import './TaskList.scss';

/**
 * TaskList Component
 * Displays a list of tasks for today
 * @param {Array} tasks - Array of task objects { id, type, text, urgent, time, linkTo? }
 */
const TaskList = ({ tasks = [] }) => {
  const getTaskIcon = (type) => {
    switch (type) {
      case 'urgent':
      case 'maintenance':
      case 'equipment_broken':
        return <FaExclamationCircle className="task-icon urgent" />;
      case 'equipment_under_repair':
        return <FaWrench className="task-icon warning" />;
      case 'completed':
      case 'checkin':
      case 'checkout':
        return <FaCheckCircle className="task-icon completed" />;
      default:
        return <FaExclamationCircle className="task-icon urgent" />;
    }
  };

  return (
    <div className="task-list">
      <h3 className="task-list-title">Công việc hôm nay</h3>
      <div className="tasks-container">
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const rowClass = `task-item${task.linkTo ? ' task-item--link' : ''}`;
            const inner = (
              <>
                <div className="task-icon-wrapper">
                  {getTaskIcon(task.type)}
                </div>
                <div className="task-content">
                  <span className="task-text">{task.text}</span>
                  {task.time && <span className="task-time">{task.time}</span>}
                </div>
                {task.urgent && <span className="task-urgent-badge">Gấp</span>}
              </>
            );
            if (task.linkTo) {
              return (
                <Link key={task.id || task.text} to={task.linkTo} className={rowClass}>
                  {inner}
                </Link>
              );
            }
            return (
              <div key={task.id || task.text} className={rowClass}>
                {inner}
              </div>
            );
          })
        ) : (
          <div className="no-tasks">Không có công việc nào hôm nay</div>
        )}
      </div>
    </div>
  );
};

export default TaskList;

