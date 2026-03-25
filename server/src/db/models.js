import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  avatar: { type: String, default: null },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  roomId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  avatar: { type: String, default: null },
  text: { type: String, default: '' },
  type: { type: String, default: 'text' },
  fileUrl: { type: String, default: null },
  fileName: { type: String, default: null },
  fileType: { type: String, default: null },
  fileSize: { type: Number, default: null },
  status: { type: String, default: 'sent' },
  readBy: [{ type: String }],
  timestamp: { type: Date, default: Date.now }
});

messageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

const reactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  messageId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true },
  emoji: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

reactionSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

export const User = mongoose.model('User', userSchema);
export const Message = mongoose.model('Message', messageSchema);
export const Reaction = mongoose.model('Reaction', reactionSchema);
