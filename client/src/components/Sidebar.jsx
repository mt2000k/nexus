import { useTheme } from '../contexts/ThemeContext';
import { FiPlus, FiSun, FiMoon, FiHash, FiLock, FiMessageCircle, FiSettings, FiLogOut } from 'react-icons/fi';

export default function Sidebar({ open, rooms, currentRoom, user, onRoomSwitch, onCreateRoom, onClose }) {
  const { theme, toggleTheme } = useTheme();

  const publicRooms = rooms.filter((r) => r.type === 'public');
  const privateRooms = rooms.filter((r) => r.type === 'private');
  const dmRooms = rooms.filter((r) => r.type === 'dm');

  const getRoomIcon = (type) => {
    switch (type) {
      case 'private': return <FiLock />;
      case 'dm': return <FiMessageCircle />;
      default: return <FiHash />;
    }
  };

  return (
    <nav className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-brand">💬 NexusChat</span>
        <div className="sidebar-actions">
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
          <button className="icon-btn" onClick={onCreateRoom} title="Create room">
            <FiPlus />
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Channels</div>
      </div>
      <ul className="room-list">
        {publicRooms.map((room) => (
          <li
            key={room.id}
            className={`room-item ${currentRoom?.id === room.id ? 'active' : ''}`}
            onClick={() => onRoomSwitch(room)}
          >
            <div className="room-icon">{getRoomIcon(room.type)}</div>
            <div className="room-info">
              <span className="room-name">{room.name}</span>
              <span className="room-meta">{room.memberCount || 0} members</span>
            </div>
          </li>
        ))}
      </ul>

      {privateRooms.length > 0 && (
        <>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Private Rooms</div>
          </div>
          <ul className="room-list">
            {privateRooms.map((room) => (
              <li
                key={room.id}
                className={`room-item ${currentRoom?.id === room.id ? 'active' : ''}`}
                onClick={() => onRoomSwitch(room)}
              >
                <div className="room-icon">{getRoomIcon(room.type)}</div>
                <div className="room-info">
                  <span className="room-name">{room.name}</span>
                  <span className="room-meta">{room.memberCount || 0} members</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {dmRooms.length > 0 && (
        <>
          <div className="sidebar-section">
            <div className="sidebar-section-title">Direct Messages</div>
          </div>
          <ul className="room-list">
            {dmRooms.map((room) => (
              <li
                key={room.id}
                className={`room-item ${currentRoom?.id === room.id ? 'active' : ''}`}
                onClick={() => onRoomSwitch(room)}
              >
                <div className="room-icon">{getRoomIcon(room.type)}</div>
                <div className="room-info">
                  <span className="room-name">{room.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div style={{ flex: 1 }} />

      <div className="sidebar-user">
        <div className="user-avatar">{user?.avatar || '😎'}</div>
        <div className="user-info">
          <span className="user-name">{user?.username}</span>
          <span className="user-status">
            <span className="status-dot" />
            Online
          </span>
        </div>
      </div>
    </nav>
  );
}
