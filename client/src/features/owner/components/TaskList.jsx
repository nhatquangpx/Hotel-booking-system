import React from 'react';
import { FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import './TaskList.scss';

/**
 * TaskList Component
 * Displays a list of tasks for today
 * @param {Array} tasks - Array of task objects { id, type, text, urgent, time }
 */
const TaskList = ({ tasks = [] }) => {
  const getTaskIcon = (type) => {
    switch (type) {
      case 'urgent':
      case 'cleaning':
      case 'maintenance':
        return <FaExclamationCircle className="task-icon urgent" />;
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
          tasks.map((task) => (
            <div key={task.id || task.text} className="task-item">
              <div className="task-icon-wrapper">
                {getTaskIcon(task.type)}
              </div>
              <div className="task-content">
                <span className="task-text">{task.text}</span>
                {task.time && (
                  <span className="task-time">{task.time}</span>
                )}
              </div>
              {task.urgent && (
                <button className="task-urgent-badge">Gấp</button>
              )}
            </div>
          ))
        ) : (
          <div className="no-tasks">Không có công việc nào hôm nay</div>
        )}
      </div>
    </div>
  );
};

export default TaskList;

