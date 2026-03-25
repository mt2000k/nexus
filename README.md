# NexusChat 🌐

NexusChat is a premium, full-stack real-time communication platform designed for seamless interaction. It combines powerful messaging features with a robust Admin Dashboard, all wrapped in a sleek, responsive interface.

![NexusChat Banner](https://img.shields.io/badge/Status-Active-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-MERN%20+%20Socket.IO-blue)
![License](https://img.shields.io/badge/License-MIT-orange)

---

## ✨ Features

### 💬 Messaging Excellence
- **Real-time Chat**: Instant message delivery powered by Socket.IO.
- **Voice Notes**: Capture and send audio messages directly within the chat.
- **Media & File Sharing**: Seamlessly upload and share images, documents, and other files.
- **Emoji Reactions**: React to any message with your favorite emojis.
- **Typing Indicators**: See when others are composing a reply in real-time.
- **Read Receipts**: Know exactly when your messages have been seen.
- **Message History & Search**: Easily find past conversations with powerful search.

### 🎥 Communication
- **HD Video Calls**: Integrated WebRTC support for high-quality video communication.
- **Reliable Connectivity**: TURN server integration ensures calls work across different networks.

### 🛡️ Admin Power
- **Ghost Mode**: Admins can monitor activity while remaining invisible to regular users.
- **User Management**: Search, filter, and manage users directly from the dashboard.
- **Real-time Stats**: View live metrics on total, online, and offline users.

### 🎨 User Experience
- **Responsive Design**: A premium UI that looks stunning on mobile, tablet, and desktop.
- **Theme Support**: Beautifully crafted dark and light modes.
- **Secure Auth**: JWT-based authentication with high-standard password hashing.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React (Vite), Socket.IO Client, WebRTC, Vanilla CSS (Premium Tokens) |
| **Backend** | Node.js, Express, Socket.IO |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Storage** | Multer (Local/Server-side storage) |
| **Real-time** | WebRTC signaling, Socket.IO Events |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB Atlas** account (or local MongoDB instance)

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
CLIENT_URL=http://localhost:5173
```
Start the server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_SERVER_URL=http://localhost:3001
# Optional: Turn server for video calls
VITE_TURN_SERVER_URL=turn:your-turn-server.com
VITE_TURN_SERVER_USERNAME=user
VITE_TURN_SERVER_PASSWORD=pass
```
Start the development server:
```bash
npm run dev
```

---

## 🛡️ Admin Activation
The platform includes a hidden activation command for developers:
1. Register a new account.
2. In any chat room, type the command `/adminme`.
3. Log out and log back in.
4. Access the **Admin Dashboard** via the ⚙️ icon in the sidebar.

---

## 🌐 Remote Access (Cloudflare Tunnels)
NexusChat is designed to be easily shared via Cloudflare tunnels. 
- Use the provided `client_url.txt` and `server_url.txt` to find current tunnel links.
- Ensure your `.env` files are updated with these URLs for cross-origin compatibility.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

Developed with ❤️ by the Nexus Team.
