# Maths Election Platform

A full-stack voting platform for the Department of Mathematics student elections, built as a monorepo with a **React** frontend and **NestJS** backend.

## Project Structure

```
maths-election-platform/
├── frontend/          # Vite + React 18 + TypeScript + Tailwind CSS
└── backend/           # NestJS + MongoDB + Redis + Cloudinary
```

## Features

### Voter Interface
- Register with matric number, full name, department, and ID card upload
- Real-time countdown timers for voting period
- Vote across 9 positions (single-choice and multi-choice)
- Celebratory confirmation page after voting
- Public results page

### Admin Panel
- Secure admin login & signup
- Analytics dashboard (total votes, turnout %, voting status)
- Candidate management (add/remove candidates per position)
- Election results with vote percentages and bar charts
- User management (voters + admins table)
- Voting security monitoring & audit logs
- Notification system (email / SMS / push)
- System settings (voting period, API URL, danger zone)
- Activity logs with level filtering

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Redis instance (Redis Cloud or local)
- Cloudinary account

### 1. Clone and install

```bash
npm run install:all
```

This installs dependencies for the root, `frontend/`, and `backend/`.

### 2. Configure environment variables

**`backend/.env`**
```env
PORT=3001
FRONTEND_URL=http://localhost:5173

MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/votingApp
MONGODB_DB_NAME=votingApp-2025
MONGODB_FETCH_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/

REDIS_URL=redis://:<password>@<host>:<port>

CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

VOTING_START_TIME=2025-06-22T12:50:00
VOTING_END_TIME=2025-06-22T17:00:00
```

**`frontend/.env.local`**
```env
VITE_API_URL=http://localhost:3001
VITE_VOTING_START_TIME=2025-06-22T12:50:00
VITE_VOTING_END_TIME=2025-06-22T17:00:00
VITE_LOGIN_END_TIME=2025-06-22T17:00:00
```

### 3. Run in development

```bash
npm run dev
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173       |
| Backend  | http://localhost:3001/api   |
| Admin    | http://localhost:5173/admin/login |

To run individually:
```bash
npm run dev:frontend
npm run dev:backend
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Register voter |
| GET | `/api/candidates` | List all candidates |
| POST | `/api/votes` | Submit vote |
| GET | `/api/results` | Get all votes |
| POST | `/api/upload` | Upload image to Cloudinary |
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/signup` | Create admin account |
| GET | `/api/admin/users` | List registered voters |
| DELETE | `/api/admin/users/:matricNumber` | Delete voter |
| GET | `/api/admin/list` | List all admins |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, React Router v6 |
| Backend | NestJS, TypeScript |
| Database | MongoDB (official driver) |
| Cache | Redis |
| Image hosting | Cloudinary |
| Fonts | Geist Sans / Geist Mono |

---

## Build for Production

```bash
# Build frontend
npm run build:frontend

# Build backend
npm run build:backend

# Run backend in production
cd backend && npm run start:prod
```

---

## Developer

Crafted & developed by [Yusasive](https://www.linkedin.com/in/yuusuf-abdullahi-temidayo-yusasive)
