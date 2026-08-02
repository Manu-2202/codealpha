# TASK 3: Project Management Tool (MERN Stack)

## Project Overview
Build a collaborative project management tool (similar to Trello or Asana). This project features user authentication, project boards creation, kanban columns (To-Do, In-Progress, Review, Done), task card additions (assignees, deadlines), and real-time updates / card comments.

---

## Core Requirements

### 1. Frontend (React + Vite)
- Fully responsive Kanban board dashboard.
- Interactive drag-and-drop or click-to-move card status changes.
- Task detail modal: assign team members, view and post comments, set task due dates.
- Board creation modal: create multiple distinct boards for separate projects.

### 2. Backend (Node.js/Express + MongoDB)
- Routes to manage user accounts, login/register, token creation.
- Board API routes (create, delete, list).
- Task API routes (create task, update task status, add comments, assign members).
- Middleware for authenticated board access.

### 3. Database (MongoDB + Mongoose)
- Models for:
  - **User**: username, email, password, avatar.
  - **Board**: title, description, owner, members.
  - **Task**: title, description, status (To Do, In Progress, Review, Done), priority, due date, board (FK), assignedTo (FK), comments (array of message, user).

---

## Installation & Running

### 1. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/taskflow
   JWT_SECRET=taskflow_secret_key_2026
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
4. Access: [http://localhost:5173](http://localhost:5173) in your browser.
