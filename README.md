# Election Platform

A full-stack, multi-election online voting platform. Admins create and manage elections; voters register per-election and cast ballots securely. Built as a monorepo with a **React + Vite** frontend and a **NestJS** backend.

**Live:**
- Frontend → [elections-portal.netlify.app](https://elections-portal.netlify.app)
- Backend API → [maths-election-platform.vercel.app/api](https://maths-election-platform.vercel.app/api)

---

## Project Structure

```
election-platform/
├── frontend/          # React 18 · Vite · TypeScript · Tailwind CSS · Framer Motion
├── backend/           # NestJS · TypeScript · MongoDB · Cloudinary
├── package.json       # Root scripts (concurrently dev, install:all)
└── .husky/            # Pre-push type-check hooks
```

---

## Features

### Voter Interface
- Per-election voter registration (matric number, full name, department, ID photo)
- Access-code-protected elections
- Real-time countdown timer for voting window
- Single-choice and multi-choice ballot positions
- Celebratory confirmation page after voting
- Public results page with vote percentages
- Dynamic page title, description, and OG image per election

### Admin Panel
- Admin registration with super-admin approval flow
- Analytics dashboard — total votes, turnout %, active elections
- Election management — create, edit, publish, close
- Candidate & position management per election
- Voter management — view and remove registered voters
- Election stats and results breakdown

### Super Admin
- Approve or decline admin registration requests
- View and manage all elections across all admins
- Delete admin accounts

### Platform
- Rate limiting (60 req/min globally; 5 vote submissions/min per IP)
- Image uploads via Cloudinary
- Health check at `GET /`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, React Router v6 |
| Backend | NestJS 10, TypeScript, Express |
| Database | MongoDB (official driver, connection-pooled for serverless) |
| Image hosting | Cloudinary |
| Deployment | Vercel (backend serverless) · Netlify (frontend SPA) |
| Code quality | Husky pre-push · tsc type-check (frontend + backend) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Cloudinary account (for image uploads)

### 1. Clone and install

```bash
git clone <repo-url>
cd election-platform
npm run install:all
```

### 2. Environment variables

**`backend/.env`**
```env
PORT=3001
FRONTEND_URL=http://localhost:5173

MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/votingApp
MONGODB_DB_NAME=votingApp

CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

JWT_SECRET=your_jwt_secret
```

**`frontend/.env.local`**
```env
VITE_API_URL=http://localhost:3001
```

### 3. Run in development

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api |
| Health check | http://localhost:3001 |
| Admin login | http://localhost:5173/admin/login |

Run individually:
```bash
npm run dev:frontend
npm run dev:backend
```

---

## API Reference

All endpoints are prefixed with `/api` except the root health check.

### Health
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/health` | Health check (versioned) |

### Elections
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/elections` | — | List public elections |
| GET | `/api/elections/mine` | Admin | List admin's own elections |
| GET | `/api/elections/all` | Super Admin | List all elections |
| POST | `/api/elections` | Admin | Create election |
| GET | `/api/elections/:slug` | — | Get election details |
| PUT | `/api/elections/:slug` | Admin | Update election |
| DELETE | `/api/elections/:slug` | Admin | Delete election |
| GET | `/api/elections/:slug/stats` | Admin | Voting stats |

### Voter Auth & Voting
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/elections/:slug/login` | Register & authenticate voter |
| POST | `/api/elections/:slug/votes` | Submit ballot (5 req/min per IP) |

### Results, Positions & Candidates
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/elections/:slug/results` | Public results |
| GET | `/api/elections/:slug/positions` | List positions |
| POST | `/api/elections/:slug/positions` | Add position (Admin) |
| GET | `/api/elections/:slug/candidates` | List candidates |
| POST | `/api/elections/:slug/candidates` | Add candidate (Admin) |
| DELETE | `/api/elections/:slug/candidates/:id` | Remove candidate (Admin) |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/setup` | Check if super admin exists |
| POST | `/api/admin/setup` | Create super admin (first run) |
| POST | `/api/admin/register` | Request admin access |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/profile` | Get own profile |
| PUT | `/api/admin/profile` | Update profile |
| GET | `/api/admin/super/admins` | List all admins (Super Admin) |
| PATCH | `/api/admin/super/admins/:id/approve` | Approve admin (Super Admin) |
| PATCH | `/api/admin/super/admins/:id/decline` | Decline admin (Super Admin) |
| DELETE | `/api/admin/super/admins/:id` | Delete admin (Super Admin) |
| GET | `/api/admin/elections/:slug/voters` | List voters for election |
| DELETE | `/api/admin/elections/:slug/voters/:matricNumber` | Remove voter |

### Upload
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/upload` | Upload image to Cloudinary |

---

## Deployment

### Backend → Vercel

The backend is wrapped as a serverless function in `backend/api/index.ts`.

1. Import the `backend/` directory in Vercel (set **Root Directory** to `backend`)
2. Vercel picks up `backend/vercel.json` automatically
3. Set environment variables in **Vercel → Settings → Environment Variables**:

```
MONGODB_URI=...
MONGODB_DB_NAME=...
CLOUD_NAME=...
CLOUD_API_KEY=...
CLOUD_API_SECRET=...
JWT_SECRET=...
FRONTEND_URL=https://your-site.netlify.app
```

> `FRONTEND_URL` controls CORS. Comma-separate multiple origins if needed:
> `FRONTEND_URL=https://site.netlify.app,https://preview.netlify.app`

### Frontend → Netlify

1. Connect the repo; set **Base directory** to `frontend`, **Build command** to `npm run build`, **Publish directory** to `dist`
2. Set environment variables in **Netlify → Site settings → Environment variables**:

```
VITE_API_URL=https://your-backend.vercel.app
```

`frontend/netlify.toml` handles SPA routing (`/* → /index.html`) automatically.

---

## Build for Production

```bash
# Frontend (outputs to frontend/dist)
npm run build:frontend

# Backend (outputs to backend/dist)
npm run build:backend

# Run backend locally in production mode
cd backend && npm run start:prod
```

---

## Pre-push Hooks

Husky runs TypeScript type-checks in both workspaces before every `git push`:

```bash
# Manually run type-checks
cd frontend && npm run type-check
cd backend  && npm run type-check
```

A push is blocked if either workspace has type errors.

---

## Developer

Crafted & developed by [Yusasive](https://www.linkedin.com/in/yuusuf-abdullahi-temidayo-yusasive)
