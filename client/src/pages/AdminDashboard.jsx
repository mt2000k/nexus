import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { fetchAdminUsers, deleteAdminUser } from '../utils/api';
import { FiTrash2, FiActivity, FiUsers, FiUserCheck, FiUserX, FiArrowLeft, FiLogOut } from 'react-icons/fi';

export default function AdminDashboard({ onGoBack }) {
  const { user, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminUsers();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();

    if (!socket) return;

    const handleUserRegistered = (newUser) => {
      setUsers((prev) => {
        if (prev.find(u => u.id === newUser.id)) return prev;
        return [newUser, ...prev];
      });
    };

    const handleUserDeleted = ({ id }) => {
      setUsers((prev) => prev.filter(u => u.id !== id));
    };

    socket.on('user_registered', handleUserRegistered);
    socket.on('user_deleted', handleUserDeleted);

    return () => {
      socket.off('user_registered', handleUserRegistered);
      socket.off('user_deleted', handleUserDeleted);
    };
  }, [loadUsers, socket]);

  const handleDelete = async (id, username) => {
    if (id === user.id) return alert('You cannot delete your own admin account.');
    if (!window.confirm(`Are you absolutely sure you want to permanently delete the user "${username}"? All their messages will also be removed.`)) return;
    
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };
  const onlineIds = new Set(onlineUsers.map(u => u.id));
  const isOnline = (id) => onlineIds.has(id);

  const totalUsers = users.length;
  const onlineCount = users.filter(u => isOnline(u.id)).length;
  const offlineCount = totalUsers - onlineCount;

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'online') return matchesSearch && isOnline(u.id);
    if (filter === 'offline') return matchesSearch && !isOnline(u.id);
    return matchesSearch;
  });

  if (loading) return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      Loading Admin Panel...
    </div>
  );

  return (
    <div className="chat-layout" style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <header className="chat-header">
        <div className="chat-header-info">
          <button className="icon-btn" onClick={onGoBack} title="Back to Chat">
            <FiArrowLeft />
          </button>
          <div>
            <div className="chat-header-title">NexusChat <span style={{ color: 'var(--accent-primary)' }}>Admin</span></div>
            <div className="chat-header-subtitle">System Dashboard</div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn" onClick={logout} title="Logout">
            <FiLogOut />
          </button>
        </div>
      </header>

      <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
        {error && <div className="login-error" style={{ marginBottom: '24px' }}>{error}</div>}
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '32px' 
        }}>
          <div className="login-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', cursor: 'pointer', border: filter === 'all' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)' }} onClick={() => setFilter('all')}>
            <div style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}><FiUsers /></div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalUsers}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Total Users</div>
            </div>
          </div>
          <div className="login-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', cursor: 'pointer', border: filter === 'online' ? '2px solid var(--success)' : '1px solid var(--border-color)' }} onClick={() => setFilter('online')}>
            <div style={{ fontSize: '2rem', color: 'var(--success)' }}><FiUserCheck /></div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{onlineCount}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Online Now</div>
            </div>
          </div>
          <div className="login-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', cursor: 'pointer', border: filter === 'offline' ? '2px solid var(--danger)' : '1px solid var(--border-color)' }} onClick={() => setFilter('offline')}>
            <div style={{ fontSize: '2rem', color: 'var(--danger)' }}><FiUserX /></div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{offlineCount}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Offline</div>
            </div>
          </div>
        </div>

        <div className="login-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FiActivity /> {filter === 'all' ? 'All' : filter === 'online' ? 'Online' : 'Offline'} Users
            </h2>
            <div style={{ position: 'relative', flex: '1', maxWidth: '300px', minWidth: '200px' }}>
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '16px' }}>User</th>
                  <th style={{ padding: '16px' }}>Email</th>
                  <th style={{ padding: '16px' }}>Joined Date</th>
                  <th style={{ padding: '16px' }}>Current Status</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const online = isOnline(u.id);
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }} className="user-row-hover">
                      <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.75rem' }}>{u.avatar || '😎'}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{u.username}</span>
                          {u.isAdmin && <span style={{ color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 700 }}>ADMINISTRATOR</span>}
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{u.email}</td>
                      <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            background: online ? 'var(--success)' : '#9ca3af'
                          }} />
                          <span style={{ 
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: online ? 'var(--success)' : 'var(--text-tertiary)'
                          }}>
                            {online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDelete(u.id, u.username)}
                          disabled={u.id === user.id}
                          className="icon-btn"
                          style={{
                            color: u.id === user.id ? 'var(--text-tertiary)' : 'var(--danger)',
                            cursor: u.id === user.id ? 'not-allowed' : 'pointer',
                            fontSize: '1.2rem',
                            margin: '0 0 0 auto'
                          }}
                          title={u.id === user.id ? "Cannot delete yourself" : "Delete user permanently"}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                <p>No results found for your selection.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
