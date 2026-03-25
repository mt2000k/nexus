import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { createSocket, EVENTS } from '../utils/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user: authUser } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState({});
  const [reactions, setReactions] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (!token || !authUser) return;

    const socket = createSocket(token);
    socketRef.current = socket;
    socket.connect();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => {
      console.error('🔌 Socket connection error:', err.message);
    });

    socket.on('init_data', (data) => {
      setUser(data.user);
      setRooms(data.rooms);
      setCurrentRoom(data.currentRoom);
    });

    socket.on(EVENTS.ONLINE_USERS, (users) => setOnlineUsers(users));

    socket.on(EVENTS.ROOM_CREATED, (room) => {
      setRooms((prev) => {
        if (prev.find((r) => r.id === room.id)) return prev;
        return [...prev, room];
      });
    });

    socket.on(EVENTS.ROOMS_UPDATED, (updatedRooms) => setRooms(updatedRooms));

    socket.on(EVENTS.RECEIVE_MESSAGE, (msg) => {
      setMessages((prev) => ({
        ...prev,
        [msg.roomId]: [...(prev[msg.roomId] || []), msg],
      }));
    });

    socket.on(EVENTS.USER_JOINED, ({ user: joinedUser, roomId, members }) => {
      setMessages((prev) => ({
        ...prev,
        [roomId]: [
          ...(prev[roomId] || []),
          { id: `sys-${Date.now()}`, type: 'system', text: `${joinedUser.username} joined the room`, roomId, timestamp: Date.now() },
        ],
      }));
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, members, memberCount: members.length } : r))
      );
      setCurrentRoom((prev) => {
        if (prev && prev.id === roomId) {
          return { ...prev, members, memberCount: members.length };
        }
        return prev;
      });
    });

    socket.on(EVENTS.USER_LEFT, ({ user: leftUser, roomId, members }) => {
      setMessages((prev) => ({
        ...prev,
        [roomId]: [
          ...(prev[roomId] || []),
          { id: `sys-${Date.now()}`, type: 'system', text: `${leftUser.username} left the room`, roomId, timestamp: Date.now() },
        ],
      }));
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, members, memberCount: members.length } : r))
      );
      setCurrentRoom((prev) => {
        if (prev && prev.id === roomId) {
          return { ...prev, members, memberCount: members.length };
        }
        return prev;
      });
    });

    socket.on(EVENTS.USER_TYPING, ({ username, roomId }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [roomId]: { ...(prev[roomId] || {}), [username]: true },
      }));
    });

    socket.on(EVENTS.USER_STOP_TYPING, ({ username, roomId }) => {
      setTypingUsers((prev) => {
        const roomTyping = { ...(prev[roomId] || {}) };
        delete roomTyping[username];
        return { ...prev, [roomId]: roomTyping };
      });
    });

    socket.on('reaction_updated', ({ messageId, reactions: rxns }) => {
      setReactions((prev) => ({ ...prev, [messageId]: rxns }));
    });

    socket.on('message_read', ({ messageId, readBy, status }) => {
      setMessages((prev) => {
        const updated = {};
        for (const [roomId, msgs] of Object.entries(prev)) {
          updated[roomId] = msgs.map((m) =>
            m.id === messageId ? { ...m, readBy, status } : m
          );
        }
        return updated;
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, authUser]);

  const joinRoom = useCallback((roomId) => {
    return new Promise((resolve) => {
      socketRef.current?.emit(EVENTS.JOIN_ROOM, { roomId }, (response) => {
        if (!response.error) {
          setCurrentRoom(response);
        }
        resolve(response);
      });
    });
  }, []);

  const leaveRoom = useCallback((roomId) => {
    socketRef.current?.emit(EVENTS.LEAVE_ROOM, { roomId });
  }, []);

  const createRoom = useCallback((name, description, type) => {
    return new Promise((resolve) => {
      socketRef.current?.emit(EVENTS.CREATE_ROOM, { name, description, type }, (room) => {
        resolve(room);
      });
    });
  }, []);

  const sendMessage = useCallback((roomId, text) => {
    socketRef.current?.emit(EVENTS.SEND_MESSAGE, { roomId, text });
  }, []);

  const sendFile = useCallback((roomId, fileData) => {
    socketRef.current?.emit('send_file', { roomId, ...fileData });
  }, []);

  const sendVoice = useCallback((roomId, voiceData) => {
    socketRef.current?.emit('send_voice', { roomId, ...voiceData });
  }, []);

  const loadHistory = useCallback((roomId, limit, before) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('load_history', { roomId, limit, before }, (data) => {
        if (data?.messages) {
          setMessages((prev) => ({
            ...prev,
            [roomId]: data.messages,
          }));
          if (data.reactions) {
            const rxnMap = {};
            data.reactions.forEach((r) => {
              if (!rxnMap[r.messageId]) rxnMap[r.messageId] = [];
              rxnMap[r.messageId].push(r);
            });
            setReactions((prev) => ({ ...prev, ...rxnMap }));
          }
        }
        resolve(data);
      });
    });
  }, []);

  const searchMessages = useCallback((roomId, query) => {
    return new Promise((resolve) => {
      socketRef.current?.emit('search_messages', { roomId, query }, (results) => {
        resolve(results);
      });
    });
  }, []);

  const addReaction = useCallback((roomId, messageId, emoji) => {
    socketRef.current?.emit('add_reaction', { roomId, messageId, emoji });
  }, []);

  const removeReaction = useCallback((roomId, messageId, emoji) => {
    socketRef.current?.emit('remove_reaction', { roomId, messageId, emoji });
  }, []);

  const markRead = useCallback((roomId, messageId) => {
    socketRef.current?.emit('mark_read', { roomId, messageId });
  }, []);

  const startTyping = useCallback((roomId) => {
    socketRef.current?.emit(EVENTS.TYPING, { roomId });
  }, []);

  const stopTyping = useCallback((roomId) => {
    socketRef.current?.emit(EVENTS.STOP_TYPING, { roomId });
  }, []);

  const value = {
    socket: socketRef.current,
    connected,
    user,
    rooms,
    currentRoom,
    setCurrentRoom,
    onlineUsers,
    messages,
    reactions,
    typingUsers,
    joinRoom,
    leaveRoom,
    createRoom,
    sendMessage,
    sendFile,
    sendVoice,
    loadHistory,
    searchMessages,
    addReaction,
    removeReaction,
    markRead,
    startTyping,
    stopTyping,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
