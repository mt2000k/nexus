import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import UserList from '../components/UserList';
import VideoCall from '../components/VideoCall';
import Notification from '../components/Notification';
import CreateRoomModal from '../components/CreateRoomModal';

export default function ChatPage({ onOpenAdmin }) {
  const {
    socket, user, rooms, currentRoom, setCurrentRoom,
    joinRoom, leaveRoom, createRoom,
    sendMessage, sendFile, sendVoice,
    loadHistory, searchMessages, addReaction, removeReaction, markRead,
    startTyping, stopTyping, messages, reactions, typingUsers,
  } = useSocket();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showUserList, setShowUserList] = useState(window.innerWidth > 768);
  const [notifications, setNotifications] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [outgoingCall, setOutgoingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    if (currentRoom) {
      loadHistory(currentRoom.id, 50);
    }
  }, [currentRoom, loadHistory]);

  const handleSendMessage = useCallback((text) => {
    if (!currentRoom || !text.trim()) return;
    sendMessage(currentRoom.id, text);
  }, [currentRoom, sendMessage]);

  const handleSendFile = useCallback((fileData) => {
    if (!currentRoom) return;
    sendFile(currentRoom.id, fileData);
  }, [currentRoom, sendFile]);

  const handleSendVoice = useCallback((voiceData) => {
    if (!currentRoom) return;
    sendVoice(currentRoom.id, voiceData);
  }, [currentRoom, sendVoice]);

  const handleRoomSwitch = useCallback(async (room) => {
    if (currentRoom?.id === room.id) return;
    if (currentRoom) leaveRoom(currentRoom.id);
    await joinRoom(room.id);
    setCurrentRoom(room);
    setSidebarOpen(false);
    setSearchResults(null);
  }, [currentRoom, joinRoom, leaveRoom, setCurrentRoom]);

  const handleCreateRoom = useCallback(async (name, description, type) => {
    const room = await createRoom(name, description, type);
    if (room && !room.error) {
      await joinRoom(room.id);
      setCurrentRoom(room);
      setShowCreateRoom(false);
    }
  }, [createRoom, joinRoom, setCurrentRoom]);

  const handleReaction = useCallback((messageId, emoji) => {
    if (!currentRoom) return;
    const existing = reactions[messageId]?.find(
      (r) => r.emoji === emoji && (r.userId === user?.dbId || r.userId === user?.id)
    );
    if (existing) {
      removeReaction(currentRoom.id, messageId, emoji);
    } else {
      addReaction(currentRoom.id, messageId, emoji);
    }
  }, [currentRoom, reactions, user, addReaction, removeReaction]);

  const handleSearch = useCallback(async (roomId, query) => {
    if (!roomId || !query) return;
    const results = await searchMessages(roomId, query);
    setSearchResults(results);
  }, [searchMessages]);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { ...notification, id }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 5000);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleIncoming = (data) => {
      setIncomingCall(data);
      addNotification({ type: 'info', title: 'Incoming Call', body: `${data.callerName} is calling you` });
    };
    const handleIncomingGroup = (data) => {
      addNotification({ 
        type: 'info', 
        title: 'Group Call Started', 
        body: `${data.callerName} started a ${data.mode} call in # ${currentRoom?.name}`,
        onClick: () => {
          setActiveCall({ targetUserId: data.callerId, targetUserName: `Group Call Started by ${data.callerName}`, mode: data.mode, isCaller: false, isGroup: true });
        }
      });
    };
    const handleAccepted = () => {
      setOutgoingCall((prev) => {
        if (prev) {
          setActiveCall({
            targetUserId: prev.targetUserId,
            targetUserName: prev.targetUserName,
            mode: prev.mode,
            isCaller: true,
          });
          return null;
        }
        return prev;
      });
    };
    const handleEnded = () => { setActiveCall(null); setIncomingCall(null); setOutgoingCall(null); };
    const handleRejected = (data) => {
      setOutgoingCall(null);
      setActiveCall(null);
      addNotification({ type: 'warning', title: 'Call Rejected', body: `${data.rejectedByName} rejected your call` });
    };

    socket.on('incoming_call', handleIncoming);
    socket.on('incoming_group_call', handleIncomingGroup);
    socket.on('call_accepted', handleAccepted);
    socket.on('call_ended', handleEnded);
    socket.on('call_rejected', handleRejected);
    return () => {
      socket.off('incoming_call', handleIncoming);
      socket.off('incoming_group_call', handleIncomingGroup);
      socket.off('call_accepted', handleAccepted);
      socket.off('call_ended', handleEnded);
      socket.off('call_rejected', handleRejected);
    };
  }, [socket, addNotification, currentRoom]);

  const onCallUserHandler = useCallback((target, mode) => {
    if (!socket) return;
    if (target.type === 'group') {
      socket.emit('call_room', { roomId: target.roomId, mode });
      
      setActiveCall({
        targetUserId: target.roomId,
        targetUserName: `Group: ${currentRoom?.name}`,
        mode,
        isCaller: true,
        isGroup: true
      });
    } else {
      socket.emit('call_user', { targetUserId: target.id, roomId: currentRoom?.id, mode });
      setOutgoingCall({ targetUserId: target.id, targetUserName: target.username, mode });
    }
  }, [socket, currentRoom]);

  const currentMessages = messages[currentRoom?.id] || [];

  const currentTypingUsers = currentRoom
    ? Object.keys(typingUsers[currentRoom.id] || {}).filter((u) => u !== user?.username)
    : [];

  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const deltaX = touchStartRef.current - touchEndRef.current;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX < 0) {
        
        if (showUserList) {
          setShowUserList(false);
        } else {
          setSidebarOpen(true);
        }
      } else {
        
        if (sidebarOpen) {
          setSidebarOpen(false);
        } else {
          setShowUserList(true);
        }
      }
    }
  };

  return (
    <div 
      className="chat-layout"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(sidebarOpen || showUserList) && (
        <div 
          className="sidebar-overlay mobile-only" 
          onClick={() => {
            setSidebarOpen(false);
            setShowUserList(false);
          }} 
        />
      )}
      <Sidebar
        open={sidebarOpen}
        rooms={rooms}
        currentRoom={currentRoom}
        user={user}
        onRoomSwitch={handleRoomSwitch}
        onCreateRoom={() => setShowCreateRoom(true)}
        onClose={() => setSidebarOpen(false)}
        onLogout={logout}
        onOpenAdmin={onOpenAdmin}
      />
      <ChatWindow
        currentRoom={currentRoom}
        user={user}
        messages={currentMessages}
        typingUsers={currentTypingUsers}
        reactions={reactions}
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onSendVoice={handleSendVoice}
        onStartTyping={() => currentRoom && startTyping(currentRoom.id)}
        onStopTyping={() => currentRoom && stopTyping(currentRoom.id)}
        onToggleUsers={() => setShowUserList((prev) => !prev)}
        onCallUser={onCallUserHandler}
        showUserList={showUserList}
        onReaction={handleReaction}
        onSearch={handleSearch}
        searchResults={searchResults}
        onMarkRead={markRead}
        onOpenAdmin={onOpenAdmin}
        onLogout={logout}
        onMenuClick={() => setSidebarOpen(true)}
      />
      {currentRoom && (
        <UserList 
          members={currentRoom.members || []} 
          currentUser={user} 
          open={showUserList} 
          onCallUser={onCallUserHandler}
        />
      )}
      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onCreate={handleCreateRoom}
        />
      )}
      {activeCall && (
        <VideoCall
          socket={socket}
          user={user}
          targetUserId={activeCall.targetUserId}
          targetUserName={activeCall.targetUserName}
          isCaller={activeCall.isCaller}
          mode={activeCall.mode}
          onEnd={() => {
            socket?.emit('end_call', { targetUserId: activeCall.targetUserId });
            setActiveCall(null);
          }}
        />
      )}
      {outgoingCall && !activeCall && (
        <div className="incoming-call-modal">
          <div className="incoming-call-info">
            <div className="user-avatar">📞</div>
            <div>
              <div style={{ fontWeight: 700 }}>{outgoingCall.targetUserName}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ringing...</div>
            </div>
          </div>
          <div className="incoming-call-actions">
            <button className="call-btn reject" onClick={() => {
              socket?.emit('end_call', { targetUserId: outgoingCall.targetUserId });
              setOutgoingCall(null);
            }}>Cancel</button>
          </div>
        </div>
      )}
      {incomingCall && !activeCall && (
        <div className="incoming-call-modal">
          <div className="incoming-call-info">
            <div className="user-avatar">{incomingCall.callerAvatar || '📞'}</div>
            <div>
              <div style={{ fontWeight: 700 }}>{incomingCall.callerName}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Incoming {incomingCall.mode === 'audio' ? 'voice' : 'video'} call...</div>
            </div>
          </div>
          <div className="incoming-call-actions">
            <button className="call-btn accept" onClick={() => {
              socket?.emit('accept_call', { callerId: incomingCall.callerId });
              setActiveCall({ targetUserId: incomingCall.callerId, targetUserName: incomingCall.callerName, mode: incomingCall.mode || 'video', isCaller: false });
              setIncomingCall(null);
            }}>Accept</button>
            <button className="call-btn reject" onClick={() => {
              socket?.emit('reject_call', { callerId: incomingCall.callerId });
              setIncomingCall(null);
            }}>Decline</button>
          </div>
        </div>
      )}
      <Notification notifications={notifications} onClose={(id) => setNotifications((prev) => prev.filter((n) => n.id !== id))} />
    </div>
  );
}
