import { FiX, FiInfo, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

const ICONS = {
  info: <FiInfo />,
  success: <FiCheckCircle />,
  warning: <FiAlertTriangle />,
};

export default function Notification({ notifications, onClose }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map((n) => (
        <div key={n.id} className={`notification-toast ${n.type || 'info'}`}>
          <span className="notification-icon">{ICONS[n.type] || ICONS.info}</span>
          <div className="notification-content">
            <div className="notification-title">{n.title}</div>
            <div className="notification-body">{n.body}</div>
          </div>
          <button className="notification-close" onClick={() => onClose(n.id)}>
            <FiX />
          </button>
        </div>
      ))}
    </div>
  );
}
