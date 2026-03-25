export default function registerRoomHandlers(io, socket, userManager, roomManager) {
  socket.on('get_rooms', (callback) => {
    const rooms = roomManager.listRooms();
    if (typeof callback === 'function') callback(rooms);
  });

  socket.on('create_room', (data, callback) => {
    const user = userManager.getUser(socket.id);
    if (!user || !data.name) return;

    const room = roomManager.createRoom({
      name: data.name,
      description: data.description || '',
      type: data.type || 'public',
      createdBy: user.username,
    });

    io.emit('room_created', room);
    if (typeof callback === 'function') callback(room);
  });

  socket.on('join_room', (data, callback) => {
    const user = userManager.getUser(socket.id);
    if (!user || !data.roomId) return;

    const room = roomManager.joinRoom(data.roomId, user);
    if (!room) {
      if (typeof callback === 'function') callback({ error: 'Room not found' });
      return;
    }

    socket.join(data.roomId);

    socket.to(data.roomId).emit('user_joined', {
      user,
      roomId: data.roomId,
      members: room.members,
    });

    if (typeof callback === 'function') callback(room);
  });

  socket.on('leave_room', (data) => {
    const user = userManager.getUser(socket.id);
    if (!user || !data.roomId) return;

    socket.leave(data.roomId);
    roomManager.leaveRoom(data.roomId, socket.id);

    socket.to(data.roomId).emit('user_left', {
      user,
      roomId: data.roomId,
      members: roomManager.getRoomMembers(data.roomId),
    });

    io.emit('rooms_updated', roomManager.listRooms());
  });

  socket.on('get_room_members', (data, callback) => {
    if (!data.roomId) return;
    const members = roomManager.getRoomMembers(data.roomId);
    if (typeof callback === 'function') callback(members);
  });

  socket.on('create_dm', (data, callback) => {
    const user = userManager.getUser(socket.id);
    const targetUser = userManager.getUserByUsername(data.targetUsername);
    if (!user || !targetUser) {
      if (typeof callback === 'function') callback({ error: 'User not found' });
      return;
    }

    const room = roomManager.createDM(user, targetUser);

    [socket.id, targetUser.id].forEach((sid) => {
      io.sockets.sockets.get(sid)?.join(room.id);
    });

    io.to(room.id).emit('dm_created', room);
    if (typeof callback === 'function') callback(room);
  });

  socket.on('share_room_key', (data) => {
    if (!data.targetUserId || !data.roomId || !data.encryptedKey) return;
    io.to(data.targetUserId).emit('room_key_shared', {
      roomId: data.roomId,
      encryptedKey: data.encryptedKey,
      fromUserId: socket.id,
    });
  });
}
