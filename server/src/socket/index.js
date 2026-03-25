import userManager from '../managers/UserManager.js';
import roomManager from '../managers/RoomManager.js';
import db from '../db/index.js';
import registerChatHandlers from './chatHandlers.js';
import registerRoomHandlers from './roomHandlers.js';
import registerWebRTCHandlers from './webrtcHandlers.js';

export function registerSocketHandlers(io) {
  io.on('connection', async (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.username})`);

    const dbUser = await db.findUserById(socket.userId);
    if (!dbUser) {
      socket.disconnect(true);
      return;
    }

    const user = userManager.addUser(socket.id, {
      id: dbUser.id,
      username: dbUser.username,
      avatar: dbUser.avatar,
      isAdmin: dbUser.isAdmin,
    });

    const defaultRoomId = 'general';
    roomManager.joinRoom(defaultRoomId, user);
    socket.join(defaultRoomId);

    if (!user.isAdmin) {
      socket.to(defaultRoomId).emit('user_joined', {
        user,
        roomId: defaultRoomId,
        members: roomManager.getRoomMembers(defaultRoomId),
      });
    }

    const rooms = roomManager.listRooms();

    socket.emit('init_data', {
      user,
      rooms,
      currentRoom: roomManager.getRoom(defaultRoomId)
        ? roomManager.serializeRoom(roomManager.getRoom(defaultRoomId))
        : null,
    });

    
    io.emit('online_users', userManager.getAllUsers(true));

    registerChatHandlers(io, socket, userManager, db);
    registerRoomHandlers(io, socket, userManager, roomManager);
    registerWebRTCHandlers(io, socket, userManager);

    socket.on('disconnect', () => {
      const u = userManager.getUser(socket.id);
      if (u) {
        const leftRooms = roomManager.removeUserFromAllRooms(socket.id);
        if (!u.isAdmin) {
          leftRooms.forEach((roomId) => {
            socket.to(roomId).emit('user_left', {
              user: u,
              roomId,
              members: roomManager.getRoomMembers(roomId),
            });
          });
        }

        userManager.removeUser(socket.id);
        io.emit('online_users', userManager.getAllUsers(true));
        io.emit('rooms_updated', roomManager.listRooms());
        console.log(`❌ User disconnected: ${u.username} (${socket.id})`);
      }
    });
  });
}
