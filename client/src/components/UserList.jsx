import { FiPhone, FiVideo } from 'react-icons/fi';

export default function UserList({ members, currentUser, open, onCallUser }) {
  return (
    <div className={`user-list-sidebar ${open ? 'open' : ''}`}>
      <div className="user-list-header">
        Members — {members.length}
      </div>
      <ul className="user-list">
        {members.map((member) => (
          <li key={member.id} className="user-list-item">
            <div className="user-avatar small">
              {member.avatar || member.username?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: member.id === currentUser?.id ? 600 : 400 }}>
              {member.username}
              {member.id === currentUser?.id && (
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> (you)</span>
              )}
            </span>
            <span className="user-online-dot" />
            {member.id !== currentUser?.id && (
              <div className="user-list-actions">
                <button className="icon-btn xs" onClick={() => onCallUser(member, 'audio')} title="Voice Call">
                  <FiPhone />
                </button>
                <button className="icon-btn xs" onClick={() => onCallUser(member, 'video')} title="Video Call">
                  <FiVideo />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
