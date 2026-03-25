import { User, Message, Reaction } from './models.js';

class Database {
  
  async createUser({ id, username, email, passwordHash, avatar, isAdmin }) {
    return await User.create({ id, username, email, passwordHash, avatar: avatar || null, isAdmin: !!isAdmin });
  }

  async getUserCount() {
    return await User.countDocuments();
  }

  async deleteUser(userId) {
    await Message.deleteMany({ senderId: userId });
    await Reaction.deleteMany({ userId });
    const result = await User.deleteOne({ id: userId });
    return result.deletedCount > 0;
  }

  async getAllUsers() {
    return await User.find({}, { passwordHash: 0 }); 
  }

  async findUserByEmail(email) {
    
    return await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
  }

  async findUserByUsername(username) {
    return await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
  }

  async findUserById(id) {
    return await User.findOne({ id });
  }

  async updateUserAvatar(userId, avatar) {
    return await User.findOneAndUpdate({ id: userId }, { avatar }, { new: true });
  }

  async makeUserAdmin(userId) {
    return await User.findOneAndUpdate({ id: userId }, { isAdmin: true }, { new: true });
  }

  
  async saveMessage(msg) {
    const message = {
      id: msg.id,
      roomId: msg.roomId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      avatar: msg.avatar || null,
      text: msg.text || '',
      type: msg.type || 'text',
      fileUrl: msg.fileUrl || null,
      fileName: msg.fileName || null,
      fileType: msg.fileType || null,
      fileSize: msg.fileSize || null,
      status: 'sent',
      readBy: [],
      timestamp: msg.timestamp || Date.now(),
    };
    return await Message.create(message);
  }

  async getMessagesByRoom(roomId, limit = 50, before = null) {
    const query = { roomId };
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);
    return messages.reverse();
  }

  async searchMessages(roomId, query) {
    const q = new RegExp(query, 'i');
    return await Message.find({ roomId, text: q })
      .sort({ timestamp: -1 })
      .limit(30);
  }

  async updateMessageStatus(messageId, status) {
    return await Message.findOneAndUpdate({ id: messageId }, { status }, { new: true });
  }

  async markMessageRead(messageId, userId) {
    return await Message.findOneAndUpdate(
      { id: messageId },
      { $addToSet: { readBy: userId }, status: 'read' },
      { new: true }
    );
  }

  
  async addReaction(messageId, userId, username, emoji) {
    const existing = await Reaction.findOne({ messageId, userId, emoji });
    if (existing) return existing;
    
    return await Reaction.create({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      messageId,
      userId,
      username,
      emoji,
      timestamp: Date.now()
    });
  }

  async removeReaction(messageId, userId, emoji) {
    const result = await Reaction.deleteOne({ messageId, userId, emoji });
    return result.deletedCount > 0;
  }

  async getReactionsByMessage(messageId) {
    return await Reaction.find({ messageId });
  }

  async getReactionsByRoom(roomId) {
    const messages = await Message.find({ roomId }, { id: 1 });
    const msgIds = messages.map(m => m.id);
    return await Reaction.find({ messageId: { $in: msgIds } });
  }
}

export default new Database();
