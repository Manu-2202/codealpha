# TASK 1: Simple E-commerce Store (MERN Stack)

## Project Structure
This application is divided into a Node.js/Express backend and a React/Vite frontend.

```
Task_1_Simple_Ecommerce_Store/
├── backend/
│   ├── config/
│   │   └── db.js            # MongoDB Connection
│   ├── models/
│   │   ├── User.js          # Mongoose User Schema
│   │   ├── Product.js       # Mongoose Product Schema
│   │   └── Order.js         # Mongoose Order Schema
│   ├── routes/
│   │   ├── auth.js          # Auth routes (Register/Login)
│   │   ├── products.js      # Product CRUD and Listing
│   │   └── orders.js        # Checkout and Orders history
│   ├── .env                 # Environment variables
│   ├── package.json         # Backend dependencies
│   └── server.js            # Entry server file
├── frontend/
│   ├── src/
│   │   ├── main.jsx         # React DOM Entry
│   │   ├── App.jsx          # React Core Layout (with State & APIs)
│   │   └── index.css        # Premium Global CSS Styles
│   ├── index.html           # Main template
│   ├── vite.config.js       # Vite configuration
│   └── package.json         # Frontend dependencies
└── README.md
```

---

## Backend Requirements (Express & MongoDB)

### 1. Database models
- **User**: Username, Email, Password (hashed), Created Date.
- **Product**: Name, Description, Price, Image/Color, Category, Rating, Stock.
- **Order**: User ID, Items (Product ID, Quantity, Price), Total Amount, Shipping Address, Status.

### 2. API Endpoints
- `POST /api/auth/register` : Create a new user account.
- `POST /api/auth/login` : Authenticate user & return JWT token.
- `GET /api/products` : Retrieve list of products (supports filter and sort).
- `GET /api/products/:id` : Retrieve details of a single product.
- `POST /api/orders` : Create a new order (requires JWT auth header).
- `GET /api/orders` : Fetch user's order history (requires JWT auth header).

---

## Frontend Requirements (React & Vite)
- Fully interactive dashboard using state, hooks (`useState`, `useEffect`), and Axios/Fetch calls.
- Rich CSS styling (dark-themed glassmorphism, responsive grid, smooth animations).
- State-managed Shopping Cart, Login/Registration forms, Checkout steps, and Product Details view.

---

## Installation & Running

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed on your computer.
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) installed and running, or a MongoDB Atlas connection string.

### 2. Backend Setup
1. Open terminal inside the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment in `.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/nexshop
   JWT_SECRET=supersecrettoken
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal inside the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.
