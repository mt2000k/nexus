class UserManager {
  constructor() {
    this.users = new Map();
    this.socketToUser = new Map();
  }

  addUser(socketId, userData) {
    const user = {
      id: socketId,
      dbId: userData.id || socketId,
      username: userData.username,
      avatar: userData.avatar || null,
      isAdmin: !!userData.isAdmin,
      status: 'online',
      joinedAt: Date.now(),
    };
    this.users.set(socketId, user);
    this.socketToUser.set(socketId, user);
    return user;
  }

  removeUser(socketId) {
    const user = this.users.get(socketId);
    this.users.delete(socketId);
    this.socketToUser.delete(socketId);
    return user;
  }

  getUser(socketId) {
    return this.users.get(socketId);
  }

  getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
  }

  getAllUsers(filterAdmins = false) {
    const users = Array.from(this.users.values());
    if (filterAdmins) {
      return users.filter(u => !u.isAdmin);
    }
    return users;
  }

  isUsernameTaken(username) {
    return Array.from(this.users.values()).some(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
  }
}

export default new UserManager();
