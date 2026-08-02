# TASK 4: Real-Time Communication App (MERN Stack)

## Project Overview
Build a collaborative, real-time video conferencing and whiteboard communication application. This project integrates WebRTC for peer-to-peer audio/video streaming, Socket.io for socket signaling server communication, and an interactive HTML5 canvas whiteboard for real-time draw/write collaborations.

---

## Core Requirements

### 1. Frontend (React + Vite)
- Video streams layout (user camera window + remote peer camera windows).
- Collaborative Whiteboard: HTML5 Canvas drawing, color picker, brush thickness, and clearing options.
- Group messaging chat sidebar panel.
- Controls toolbar: Mute/Unmute microphone, Turn Camera On/Off, Share Screen, and Clear Canvas.

### 2. Backend (Node.js/Express + WebSockets)
- Express server integrated with HTTP server to attach Socket.io.
- WebSockets signalling room connections: `join-room`, `webrtc-offer`, `webrtc-answer`, `webrtc-candidate`, and `whiteboard-draw` socket events.
- JWT token auth endpoints.

### 3. Media & Security
- WebRTC PeerConnection setup.
- Canvas state syncing across socket streams.
- Local data security, token verification middleware.

---

## Installation & Running

### 1. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies (contains `socket.io` for signaling):
   ```bash
   npm install
   ```
3. Create `.env` file:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/nexcall
   JWT_SECRET=nexcall_secret_key_2026
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.
