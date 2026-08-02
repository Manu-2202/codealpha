# TASK 2: Social Media Platform

## Project Overview
Create a mini social media application. This project focuses on building user authentication, news feed posts, a comments section, user profile pages, and a system to manage user likes and follow relationships.

---

## Core Requirements

### 1. Frontend (HTML, CSS, JavaScript)
- Interactive feed layout (cards representing individual posts with comments, likes, and post author details).
- Multi-view navigation (switching between the main News Feed and the Profile page).
- Smooth interactions: click likes to toggle, expand comments section, and dynamically create new posts.

### 2. Backend (Node.js/Express or Python/Django)
- RESTful API endpoints for creating, editing, and deleting posts.
- Comment posting endpoints.
- Like/Unlike toggle routes.
- Follower/Following link management routes.
- User authentication and authorization middleware.

### 3. Database (PostgreSQL, MySQL, or MongoDB)
- Relational mapping between users, posts, comments, likes, and followers.

---

## Features to Implement

- [x] **User Profiles:** Render profile pages containing the user's avatar, bio, follower metrics, and a list of posts authored by them.
- [x] **Posts & Comments:** Form to publish text posts, list posts in a timeline view, click comments to reveal a list of comments, and insert new comments dynamically.
- [x] **Like/Follow System:** Interactive buttons allowing users to like/unlike posts (updating the counter in real time) and follow/unfollow other users.
- [x] **User Registration/Login:** Simple auth toggle for session simulation.

---

## Recommended Database Schema

### Users Table
| Field | Type | Description |
|---|---|---|
| `id` | UUID / INT (PK) | Unique user identifier |
| `username` | VARCHAR(50) | Unique username |
| `bio` | TEXT | Profile biography |
| `avatar_url` | VARCHAR(255) | Link to avatar image |
| `password` | VARCHAR(255) | Hashed password |
| `created_at`| TIMESTAMP | Account creation date |

### Posts Table
| Field | Type | Description |
|---|---|---|
| `id` | UUID / INT (PK) | Unique post identifier |
| `user_id` | INT (FK) | References Users (Author) |
| `content` | TEXT | Post content |
| `image_url` | VARCHAR(255) | Optional post media |
| `created_at`| TIMESTAMP | Time published |

### Comments Table
| Field | Type | Description |
|---|---|---|
| `id` | UUID / INT (PK) | Unique comment identifier |
| `post_id` | INT (FK) | References Posts |
| `user_id` | INT (FK) | References Users (Author) |
| `content` | TEXT | Comment content |
| `created_at`| TIMESTAMP | Time commented |

### Likes Table (Many-to-Many Join Table)
| Field | Type | Description |
|---|---|---|
| `id` | INT (PK) | Unique identifier |
| `post_id` | INT (FK) | References Posts |
| `user_id` | INT (FK) | References Users |

### Followers Table (Self-referencing Relationship)
| Field | Type | Description |
|---|---|---|
| `id` | INT (PK) | Unique identifier |
| `follower_id`| INT (FK) | References Users (User who follows) |
| `followed_id`| INT (FK) | References Users (User being followed) |

---

## Getting Started

1. **Frontend Development:**
   - Double-click `index.html` to open the social media app.
   - Initial feed data, comments, and profile values are managed via memory arrays and persisted via `localStorage` for testing.

2. **Backend Development (Next Steps):**
   - Initialize your backend app inside `backend/`.
   - Setup models matching the schema.
   - Connect the UI components to database APIs (e.g. replacing `localStorage` updates with endpoints like `POST /api/posts` and `POST /api/likes`).
