export default function registerWebRTCHandlers(io, socket, userManager) {
  socket.on('call_user', (data) => {
    const caller = userManager.getUser(socket.id);
    if (!caller || !data.targetUserId) return;

    io.to(data.targetUserId).emit('incoming_call', {
      callerId: socket.id,
      callerName: caller.username,
      callerAvatar: caller.avatar,
      roomId: data.roomId,
      mode: data.mode || 'video',
    });
  });

  socket.on('call_room', (data) => {
    const caller = userManager.getUser(socket.id);
    if (!caller || !data.roomId) return;

    socket.to(data.roomId).emit('incoming_group_call', {
      callerId: socket.id,
      callerName: caller.username,
      callerAvatar: caller.avatar,
      roomId: data.roomId,
      mode: data.mode || 'video',
    });
  });

  socket.on('accept_call', (data) => {
    if (!data.callerId) return;
    const user = userManager.getUser(socket.id);
    io.to(data.callerId).emit('call_accepted', {
      acceptedBy: socket.id,
      acceptedByName: user?.username,
    });
  });

  socket.on('reject_call', (data) => {
    if (!data.callerId) return;
    const user = userManager.getUser(socket.id);
    io.to(data.callerId).emit('call_rejected', {
      rejectedBy: socket.id,
      rejectedByName: user?.username,
    });
  });

  socket.on('end_call', (data) => {
    if (!data.targetUserId) return;
    io.to(data.targetUserId).emit('call_ended', {
      endedBy: socket.id,
    });
  });

  socket.on('offer', (data) => {
    if (!data.targetUserId || !data.sdp) return;
    io.to(data.targetUserId).emit('offer', {
      sdp: data.sdp,
      callerId: socket.id,
    });
  });

  socket.on('answer', (data) => {
    if (!data.targetUserId || !data.sdp) return;
    io.to(data.targetUserId).emit('answer', {
      sdp: data.sdp,
      answererId: socket.id,
    });
  });

  socket.on('ice_candidate', (data) => {
    if (!data.targetUserId || !data.candidate) return;
    io.to(data.targetUserId).emit('ice_candidate', {
      candidate: data.candidate,
      fromUserId: socket.id,
    });
  });
}
