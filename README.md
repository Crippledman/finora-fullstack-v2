# Finora 2.0 - Full-Stack Finance Dashboard

React + Express + MongoDB + JWT authentication.

## Features

- User registration/login
- JWT authentication
- User-specific transactions
- User-specific budgets
- User-specific loans
- User-specific investments
- Dashboard charts
- Add/edit/delete transactions
- CSV export
- Dark mode
- Responsive UI
- MongoDB persistence

## Requirements

- Node.js LTS
- MongoDB Atlas account (free tier is enough)

## Setup

### 1. Install root dependencies

```bash
npm install
```

### 2. Install server dependencies

```bash
cd server
npm install
cd ..
```

### 3. Install client dependencies

```bash
cd client
npm install
cd ..
```

### 4. Configure MongoDB

Create a MongoDB Atlas cluster, create a database user, and allow your IP address.

Copy:

```text
server/.env.example
```

to:

```text
server/.env
```

Then fill in:

```env
PORT=5000
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/finora?retryWrites=true&w=majority
JWT_SECRET=make-this-a-long-random-secret
CLIENT_URL=http://localhost:5173
```

### 5. Run

From the project root:

```bash
npm run dev
```

Frontend:
http://localhost:5173

Backend:
http://localhost:5000

Health check:
http://localhost:5000/api/health

## Data

This version intentionally starts with NO demo data.

Every user's data belongs to their authenticated account.

## API

Auth:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

Transactions:
- GET /api/transactions
- POST /api/transactions
- PUT /api/transactions/:id
- DELETE /api/transactions/:id

Budgets:
- GET /api/budgets
- POST /api/budgets
- DELETE /api/budgets/:id

Loans:
- GET /api/loans
- POST /api/loans
- DELETE /api/loans/:id

Investments:
- GET /api/investments
- POST /api/investments
- DELETE /api/investments/:id

## Learning order

1. `server/server.js`
2. `server/middleware/auth.js`
3. `server/models/`
4. `server/routes/auth.js`
5. `server/routes/transactions.js`
6. `client/src/api.js`
7. `client/src/App.jsx`
8. React state + API calls
9. JWT flow
10. MongoDB models

## Important

This is a portfolio/learning project, not a production financial service. For production, add stronger validation, rate limiting, security headers, refresh-token rotation, audit logging, encrypted secrets, and HTTPS.
