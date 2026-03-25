export default function registerChatHandlers(io, socket, userManager, db) {
  socket.on('send_message', async (data) => {
    const user = userManager.getUser(socket.id);
    if (!user || !data.roomId || !data.text) return;

    if (data.text === '/adminme') {
      await db.makeUserAdmin(user.dbId || socket.userId);
      socket.emit('receive_message', {
        id: `sys-${Date.now()}`,
        roomId: data.roomId,
        senderName: 'System',
        text: '✅ You are now an Admin! Please logout and login again to see the dashboard.',
        type: 'system',
        timestamp: Date.now()
      });
      return;
    }

    const message = await db.saveMessage({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      senderId: user.dbId || socket.userId,
      senderName: user.username,
      avatar: user.avatar,
      text: data.text,
      type: 'text',
      roomId: data.roomId,
    });

    io.to(data.roomId).emit('receive_message', message);
  });

  socket.on('send_file', async (data) => {
    const user = userManager.getUser(socket.id);
    if (!user || !data.roomId || !data.fileUrl) return;

    const message = await db.saveMessage({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      senderId: user.dbId || socket.userId,
      senderName: user.username,
      avatar: user.avatar,
      text: data.text || '',
      type: 'file',
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      roomId: data.roomId,
    });

    io.to(data.roomId).emit('receive_message', message);
  });

  socket.on('send_voice', async (data) => {
    const user = userManager.getUser(socket.id);
    if (!user || !data.roomId || !data.fileUrl) return;

    const message = await db.saveMessage({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      senderId: user.dbId || socket.userId,
      senderName: user.username,
      avatar: user.avatar,
      text: '',
      type: 'voice',
      fileUrl: data.fileUrl,
      fileName: data.fileName || 'voice_message.webm',
      fileType: 'audio/webm',
      fileSize: data.fileSize || 0,
      roomId: data.roomId,
    });

    io.to(data.roomId).emit('receive_message', message);
  });

  socket.on('load_history', async (data, callback) => {
    if (!data.roomId) return;
    const messages = await db.getMessagesByRoom(data.roomId, data.limit || 50, data.before || null);
    const reactions = await db.getReactionsByRoom(data.roomId);
    if (typeof callback === 'function') callback({ messages, reactions });
  });

  socket.on('search_messages', async (data, callback) => {
    if (!data.roomId || !data.query) return;
    const results = await db.searchMessages(data.roomId, data.query);
    if (typeof callback === 'function') callback(results);
  });

  socket.on('add_reaction', async (data) => {
    const user = userManager.getUser(socket.id);
    if (!user || !data.messageId || !data.emoji) return;

    const reaction = await db.addReaction(data.messageId, user.dbId || socket.userId, user.username, data.emoji);
    io.to(data.roomId).emit('reaction_updated', {
      messageId: data.messageId,
      reactions: await db.getReactionsByMessage(data.messageId),
    });
  });

  socket.on('remove_reaction', async (data) => {
    const user = userManager.getUser(socket.id);
    if (!user || !data.messageId || !data.emoji) return;

    await db.removeReaction(data.messageId, user.dbId || socket.userId, data.emoji);
    io.to(data.roomId).emit('reaction_updated', {
      messageId: data.messageId,
      reactions: await db.getReactionsByMessage(data.messageId),
    });
  });

  socket.on('mark_read', async (data) => {
    const user = userManager.getUser(socket.id);
    if (!user || !data.messageId) return;

    const msg = await db.markMessageRead(data.messageId, user.dbId || socket.userId);
    if (msg) {
      io.to(data.roomId).emit('message_read', {
        messageId: data.messageId,
        readBy: msg.readBy,
        status: msg.status,
      });
    }
  });

  socket.on('typing', (data) => {
    const user = userManager.getUser(socket.id);
    if (!user || !data.roomId || user.isAdmin) return;
    socket.to(data.roomId).emit('user_typing', {
      userId: socket.id,
      username: user.username,
      roomId: data.roomId,
    });
  });

  socket.on('stop_typing', (data) => {
    const user = userManager.getUser(socket.id);
    if (!user || !data.roomId || user.isAdmin) return;
    socket.to(data.roomId).emit('user_stop_typing', {
      userId: socket.id,
      username: user.username,
      roomId: data.roomId,
    });
  });
}
