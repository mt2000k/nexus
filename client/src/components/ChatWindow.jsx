import { useRef, useEffect, useState } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import SearchBar from './SearchBar';
import { FiMenu, FiVideo, FiPhone, FiUsers, FiSearch, FiLogOut, FiSettings, FiMoreVertical } from 'react-icons/fi';

export default function ChatWindow({
  currentRoom, user, messages, typingUsers, reactions,
  onSendMessage, onSendFile, onSendVoice,
  onStartTyping, onStopTyping,
  onMenuClick, onToggleUsers, onCallUser, showUserList,
  onReaction, onSearch, searchResults, onMarkRead, onOpenAdmin, onLogout,
}) {
  const messagesEndRef = useRef(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!messages || !currentRoom || !user) return;
    const unread = messages.filter(
      (m) => m.type !== 'system' && m.senderId !== user.dbId && m.senderId !== user.id && m.status !== 'read'
    );
    unread.forEach((m) => onMarkRead?.(currentRoom.id, m.id));
  }, [messages, currentRoom, user, onMarkRead]);

  const handleCallClick = (mode) => {
    if (!currentRoom) return;

    
    const isDM = currentRoom.type === 'private' && currentRoom.members?.length === 2;
    
    if (isDM) {
      const target = currentRoom.members.find((m) => m.id !== user?.id);
      if (target) onCallUser(target, mode);
    } else {
      
      onCallUser({ roomId: currentRoom.id, type: 'group' }, mode);
    }
    setShowActions(false);
  };

  const handleSearchClick = () => {
    setShowSearch((p) => !p);
    setShowActions(false);
  };

  const handleUsersClick = () => {
    onToggleUsers();
    setShowActions(false);
  };

  const handleAdminClick = () => {
    onOpenAdmin();
    setShowActions(false);
  };

  const handleSearchSelect = (msg) => {
    const el = document.getElementById(`msg-${msg.id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-msg');
      setTimeout(() => el.classList.remove('highlight-msg'), 2000);
    }
    setShowSearch(false);
  };

  return (
    <div className="chat-main">
      <header className="chat-header">
        <div className="chat-header-left">
          <button className="mobile-menu-btn icon-btn" onClick={onMenuClick}>
            <FiMenu />
          </button>
          <div className="chat-room-badge">
            <div className="chat-header-title">
              {currentRoom ? `# ${currentRoom.name}` : 'Select a room'}
            </div>
            {currentRoom && (
              <div className="chat-header-subtitle">
                {currentRoom.memberCount || 0} members
              </div>
            )}
          </div>
        </div>

        <div className="chat-header-right">
          <div className="header-action-group desktop-only-flex">
            <button className="icon-btn" onClick={() => handleCallClick('audio')} title="Voice call">
              <FiPhone />
            </button>
            <button className="icon-btn" onClick={() => handleCallClick('video')} title="Video call">
              <FiVideo />
            </button>
          </div>
          
          <div className="header-divider desktop-only" />

          <button className="icon-btn desktop-only" onClick={handleSearchClick} title="Search messages">
            <FiSearch />
          </button>
          <button className={`icon-btn desktop-only ${showUserList ? 'active' : ''}`} onClick={handleUsersClick} title="Toggle user list">
            <FiUsers />
          </button>
          {user?.isAdmin && (
            <button className="icon-btn desktop-only" style={{ color: 'var(--accent-primary)' }} onClick={handleAdminClick} title="Admin Dashboard">
              <FiSettings />
            </button>
          )}
          <button className="icon-btn desktop-only" onClick={onLogout} title="Logout">
            <FiLogOut />
          </button>

          {}
          <div className="mobile-actions-container mobile-only">
            <button className="icon-btn" onClick={() => setShowActions(!showActions)}>
              <FiMoreVertical />
            </button>
            {showActions && (
              <>
                <div className="actions-menu-overlay" onClick={() => setShowActions(false)} />
                <div className="actions-dropdown">
                  <button className="action-item" onClick={() => handleCallClick('audio')}>
                    <FiPhone /> Voice Call
                  </button>
                  <button className="action-item" onClick={() => handleCallClick('video')}>
                    <FiVideo /> Video Call
                  </button>
                  <button className="action-item" onClick={handleSearchClick}>
                    <FiSearch /> Search
                  </button>
                  <button className={`action-item ${showUserList ? 'active' : ''}`} onClick={handleUsersClick}>
                    <FiUsers /> Members
                  </button>
                  {user?.isAdmin && (
                    <button className="action-item admin-action" onClick={handleAdminClick}>
                      <FiSettings /> Admin Panel
                    </button>
                  )}
                  <div className="action-divider" />
                  <button className="action-item logout-action" onClick={onLogout}>
                    <FiLogOut /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {showSearch && (
        <SearchBar
          onSearch={(q) => onSearch?.(currentRoom?.id, q)}
          results={searchResults}
          onSelectResult={handleSearchSelect}
          onClose={() => setShowSearch(false)}
        />
      )}

      <div className="messages-container">
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', opacity: 0.5 }}>
            <div style={{ fontSize: '3rem' }}>💬</div>
            <p style={{ color: 'var(--text-tertiary)' }}>No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg) =>
          msg.type === 'system' ? (
            <div key={msg.id} className="system-message">
              <span>{msg.text}</span>
            </div>
          ) : (
            <div key={msg.id} id={`msg-${msg.id}`} style={{ display: 'flex', flexDirection: 'column' }}>
              <MessageBubble
                message={msg}
                isSent={msg.senderId === user?.dbId || msg.senderId === user?.id}
                reactions={reactions?.[msg.id] || []}
                currentUserId={user?.dbId || user?.id}
                onReaction={onReaction}
                onCallUser={onCallUser}
              />
            </div>
          )
        )}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
            <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSend={onSendMessage}
        onSendFile={onSendFile}
        onSendVoice={onSendVoice}
        onStartTyping={onStartTyping}
        onStopTyping={onStopTyping}
        disabled={!currentRoom}
      />
    </div>
  );
}
