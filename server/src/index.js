import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db/connection.js';
import { registerSocketHandlers } from './socket/index.js';
import { socketAuthMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin.js';
import userManager from './managers/UserManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
connectDB();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

app.use(cors({ 
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'], 
  credentials: true 
}));
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (_req, res) => {
  res.send('<h1>NexusChat Backend is running</h1><p>Please use the Client URL to access the chat application.</p>');
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API via proxy is working', uptime: process.uptime() });
});

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 25e6,
});

io.use(socketAuthMiddleware);

app.set('io', io);
app.set('userManager', userManager);

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Accepting connections from ${CLIENT_URL}`);
});
