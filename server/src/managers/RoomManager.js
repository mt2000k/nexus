import { v4 as uuidv4 } from 'uuid';

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this._createDefaultRooms();
  }

  _createDefaultRooms() {
    const defaults = [
      { name: 'General', description: 'General discussion for everyone' },
      { name: 'Random', description: 'Off-topic conversations' },
      { name: 'Tech Talk', description: 'Technology discussions' },
    ];
    defaults.forEach((r) => {
      const id = r.name.toLowerCase().replace(/\s+/g, '-');
      this.rooms.set(id, {
        id,
        name: r.name,
        description: r.description,
        type: 'public',
        members: new Map(),
        createdAt: Date.now(),
        createdBy: 'system',
      });
    });
  }

  createRoom({ name, description = '', type = 'public', createdBy }) {
    const id = uuidv4().slice(0, 8);
    const room = {
      id,
      name,
      description,
      type,
      members: new Map(),
      createdAt: Date.now(),
      createdBy,
    };
    this.rooms.set(id, room);
    return this.serializeRoom(room);
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId, user) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    room.members.set(user.id, user);
    return this.serializeRoom(room);
  }

  leaveRoom(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.members.delete(userId);
    if (room.members.size === 0 && room.createdBy !== 'system') {
      this.rooms.delete(roomId);
    }
  }

  getRoomMembers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.members.values());
  }

  removeUserFromAllRooms(userId) {
    const leftRooms = [];
    this.rooms.forEach((room, roomId) => {
      if (room.members.has(userId)) {
        room.members.delete(userId);
        leftRooms.push(roomId);
        if (room.members.size === 0 && room.createdBy !== 'system') {
          this.rooms.delete(roomId);
        }
      }
    });
    return leftRooms;
  }

  listRooms() {
    return Array.from(this.rooms.values()).map((r) => this.serializeRoom(r));
  }

  serializeRoom(room) {
    const allMembers = Array.from(room.members.values());
    
    const filteredMembers = room.type === 'dm'
      ? allMembers
      : allMembers.filter((u) => !u.isAdmin);

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      type: room.type,
      memberCount: filteredMembers.length,
      members: filteredMembers,
      createdAt: room.createdAt,
      createdBy: room.createdBy,
    };
  }

  createDM(user1, user2) {
    const existingDM = Array.from(this.rooms.values()).find(
      (r) =>
        r.type === 'dm' &&
        r.members.has(user1.id) &&
        r.members.has(user2.id)
    );
    if (existingDM) return this.serializeRoom(existingDM);

    const id = uuidv4().slice(0, 8);
    const room = {
      id,
      name: `${user1.username} & ${user2.username}`,
      description: 'Direct message',
      type: 'dm',
      members: new Map([
        [user1.id, user1],
        [user2.id, user2],
      ]),
      createdAt: Date.now(),
      createdBy: user1.id,
    };
    this.rooms.set(id, room);
    return this.serializeRoom(room);
  }
}

export default new RoomManager();
