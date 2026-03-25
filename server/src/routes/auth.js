import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    if (username.trim().length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (await db.findUserByEmail(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    if (await db.findUserByUsername(username.trim())) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      id: uuidv4(),
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      avatar: avatar || '😎',
      isAdmin: false,
    });

    const token = generateToken(user);
    const io = req.app.get('io');
    if (io) {
      io.emit('user_registered', { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        avatar: user.avatar, 
        isAdmin: user.isAdmin,
        createdAt: user.createdAt 
      });
    }

    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, isAdmin: user.isAdmin },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, isAdmin: user.isAdmin },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/guest-login', async (req, res) => {
  try {
    const guestId = uuidv4().split('-')[0];
    const username = `Guest_${guestId}`;
    const email = `guest_${guestId}@nexus.tmp`;
    const passwordHash = await bcrypt.hash(uuidv4(), 10);
    
    const user = await db.createUser({
      id: uuidv4(),
      username,
      email,
      passwordHash,
      avatar: '🎭',
      isAdmin: false,
    });

    const token = generateToken(user);
    const io = req.app.get('io');
    if (io) {
      io.emit('user_registered', { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        avatar: user.avatar, 
        isAdmin: user.isAdmin,
        createdAt: user.createdAt 
      });
    }

    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, isAdmin: user.isAdmin },
    });
  } catch (err) {
    console.error('Guest login error:', err);
    res.status(500).json({ error: 'Guest login failed' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, isAdmin: user.isAdmin } });
});

export default router;
