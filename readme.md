# E-GurukulX — Learn with Discipline. Grow with Knowledge.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Images-3448C5?logo=cloudinary&logoColor=white)
![YouTube API](https://img.shields.io/badge/YouTube-Data%20API-FF0000?logo=youtube&logoColor=white)
![MIT](https://img.shields.io/badge/License-MIT-green.svg)

## 📌 Overview

E-GurukulX is a full-stack self-learning platform inspired by the Gurukul tradition and designed for students who want more structure than scattered video bookmarks can provide. It turns public educational videos into organized learning journeys with playlists, progress tracking, streaks, notes, certificates, and admin oversight. Students can discover curated content, save videos into personal playlists, continue exactly where they left off, write rich notes or code snippets while learning, and earn downloadable certificates after completing a playlist. The platform also includes profile customization, category preferences, and a public certificate verification page. On the management side, admins get analytics, user controls, and category configuration tools.

## ✨ Features

- 👤 Authentication and profile management with email/password, OAuth-ready flows, avatar upload, category preferences, and password reset stub support.
- 📚 Category-based discovery with YouTube search integration, filtering, sorting, and personalized learning interests.
- 🎬 Playlist learning flow with add/remove/reorder, embedded player, resume tracking, completion state, and next-video navigation.
- 📝 Advanced notes with text, code, and quiz modes powered by TipTap and Monaco.
- 📈 Progress analytics including streaks, hours watched, dashboard metrics, and activity summaries.
- 🏆 Certificates with auto-issuance, PDF download, profile gallery, and public verification.
- 🛡️ Admin controls for platform stats, user moderation, and category management.

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 18 + Vite | SPA, routing, fast local development |
| Styling | Tailwind CSS | Utility-first responsive UI styling |
| State / Data | React hooks + Axios | API communication and local UI state |
| Rich Text Notes | TipTap | WYSIWYG note editing |
| Code Notes | Monaco Editor | Syntax-highlighted code notes |
| Backend API | Express | REST API and middleware pipeline |
| Validation | Zod | Request schema validation |
| Database ORM | Prisma | Type-safe PostgreSQL access |
| Database | PostgreSQL / Neon | Persistent app data |
| Media Storage | Cloudinary | Avatar upload and delivery |
| Video Source | YouTube Data API v3 | Category video discovery |
| Auth | JWT + httpOnly cookie | Session handling and protected routes |
| Documents | jsPDF | Certificate PDF generation |
| Deployment | Vercel + hosted API | Free-tier deployment workflow |

## 📸 Screenshots

<!-- Landing Page -->
<!-- Dashboard -->
<!-- Video Player -->
<!-- Notes Editor -->
<!-- Certificate -->

## 🚀 Free Services Setup

### 1. Neon PostgreSQL → https://neon.tech

1. Sign up with GitHub.
2. Create a new project named `e-gurukulx` in `US East`.
3. Open the project dashboard and copy the PostgreSQL connection string.
4. Paste it into `DATABASE_URL` in `backend/.env`.
5. Keep `sslmode=require` in the connection string for Neon.

### 2. Cloudinary → https://cloudinary.com

1. Create a free Cloudinary account.
2. Copy `Cloud Name`, `API Key`, and `API Secret` from the dashboard.
3. Add them to `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env`.
4. Go to Settings → Upload and add an upload preset named `e-gurukulx-avatars` if you want a dedicated avatar preset.

### 3. YouTube Data API → https://console.cloud.google.com

1. Create a Google Cloud project named `E-GurukulX`.
2. Go to APIs & Services → Library.
3. Enable `YouTube Data API v3`.
4. Go to Credentials → Create Credentials → API Key.
5. Restrict the key to `YouTube Data API v3`.
6. Add it to `VITE_YOUTUBE_API_KEY` in `backend/.env`.

### 4. Google OAuth → https://console.cloud.google.com

1. Go to Credentials → Create Credentials → OAuth Client ID.
2. Choose `Web application` and name it `E-GurukulX`.
3. Add `http://localhost:3000` to Authorized JavaScript origins.
4. Add `http://localhost:3000/auth/google/callback` to Authorized redirect URIs.
5. Copy the values into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### 5. GitHub OAuth → https://github.com/settings/developers

1. Create a new OAuth App.
2. Set Homepage URL to `http://localhost:3000`.
3. Set Authorization callback URL to `http://localhost:3000/auth/github/callback`.
4. Copy the values into `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

## 💻 Local Development

```bash
# 1. Clone
git clone <repo>
cd EduAI

# 2. Environment
copy backend\server\.env.example backend\.env
# Edit backend/.env with your Neon, Cloudinary, YouTube, and OAuth values

# 3. Install dependencies
cd backend\server
npm install

# 4. Database setup
cd ..
npx prisma migrate dev --name init --schema prisma/schema.prisma
npx prisma db seed --schema prisma/schema.prisma

# 5. Run backend
cd ..
npm run dev:backend

# 6. Run frontend in a second terminal
cd frontend
npm install
npm run dev

# Frontend -> http://localhost:3000
# Backend  -> http://localhost:5000
```

## ▲ Deploy On Vercel

This repository is now set up so the `frontend` Vite app is built as static files and `/api/*` is routed to the Express backend as a Vercel serverless function.

### 1. Push your code to GitHub

1. Create a GitHub repository if you have not already.
2. Push this project to that repository.

### 2. Import the project into Vercel

1. Sign in at https://vercel.com.
2. Click `Add New` → `Project`.
3. Import your GitHub repository.
4. Keep the project root as the repository root because this repo now includes a root `vercel.json`.

### 3. Add environment variables in Vercel

Add these in Project Settings → Environment Variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRY`
- `REFRESH_TOKEN_EXPIRY`
- `YOUTUBE_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `VITE_APP_URL`
- `ALLOWED_ORIGINS`
- `NODE_ENV` = `production`

Recommended values:

- `VITE_APP_URL` = your Vercel production URL, for example `https://your-project.vercel.app`
- `ALLOWED_ORIGINS` = your Vercel production URL, and optionally your preview URL if you use one

### 4. Deploy

1. Click `Deploy`.
2. After the build finishes, open your Vercel URL.
3. Test the API health endpoint at `/api/health`.

### 5. Important limitation

This project contains a long-running contest scheduler for local/server deployment. Vercel serverless functions do not keep that scheduler running in the background, so contest auto-refresh jobs will not run continuously after deployment. If you need that feature on Vercel, move it to Vercel Cron Jobs or a separate always-on backend service.

### 6. Easy update workflow

1. Make your changes locally.
2. Commit and push to GitHub.
3. Vercel redeploys automatically.
4. For environment variable changes, update them in Vercel Project Settings and redeploy.

## 📂 Folder Structure

```text
EduAI/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Prisma data model
│   │   └── seed.js                # Seed script
│   ├── server/
│   │   ├── index.js               # Express entry point
│   │   ├── package.json           # Backend-local package metadata
│   │   ├── .env.example           # Server-only env template
│   │   ├── middleware/            # Auth, validation, shared middleware
│   │   ├── routes/                # API route modules
│   │   ├── services/              # External API services (YouTube)
│   │   ├── utils/                 # JWT, hashing, response helpers
│   │   └── validators/            # Zod validators
│   └── src/
│       └── lib/prisma.js          # Prisma singleton
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/            # Shared layout shells
│   │   │   ├── routing/           # Route guards
│   │   │   └── ui/                # UI primitives
│   │   ├── context/               # Auth + theme context
│   │   ├── hooks/                 # Reusable data hooks
│   │   ├── lib/                   # Axios and utilities
│   │   └── pages/                 # Public, student, and admin pages
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
├── .env.example                   # Root env template
├── package.json                   # Root scripts for app + database
└── readme.md                      # Project documentation
```

## 🔗 API Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | No | API health check |
| POST | `/api/auth/register` | No | Create a new account |
| POST | `/api/auth/login` | No | Email/password login |
| POST | `/api/auth/google` | No | Google OAuth stub |
| POST | `/api/auth/github` | No | GitHub OAuth stub |
| POST | `/api/auth/logout` | Yes | End current session |
| POST | `/api/auth/forgot-password` | No | Password reset request stub |
| POST | `/api/auth/reset-password` | No | Reset password stub |
| GET | `/api/auth/me` | Yes | Current authenticated user |
| GET | `/api/user` | Yes | Profile with selected categories |
| PATCH | `/api/user` | Yes | Update profile fields |
| PATCH | `/api/user/categories` | Yes | Replace category preferences |
| PATCH | `/api/user/password` | Yes | Change password |
| DELETE | `/api/user` | Yes | Soft-delete account |
| GET | `/api/videos` | Yes | Search/fetch videos by category/query |
| GET | `/api/videos/categories` | Yes | Get available learning categories |
| GET | `/api/videos/:id` | Yes | Fetch a single video payload |
| GET | `/api/playlist` | Yes | Get all user playlists |
| POST | `/api/playlist` | Yes | Create playlist |
| PATCH | `/api/playlist/:id` | Yes | Rename/update playlist |
| DELETE | `/api/playlist/:id` | Yes | Delete playlist |
| POST | `/api/playlist/:id/videos` | Yes | Add video to playlist |
| DELETE | `/api/playlist/:id/videos/:videoId` | Yes | Remove video from playlist |
| PATCH | `/api/playlist/:id/reorder` | Yes | Reorder playlist videos |
| GET | `/api/notes` | Yes | List notes with filters |
| POST | `/api/notes` | Yes | Create note |
| PATCH | `/api/notes/:id` | Yes | Update note |
| DELETE | `/api/notes/:id` | Yes | Delete note |
| POST | `/api/progress/complete` | Yes | Mark a playlist video completed |
| PATCH | `/api/progress/watched` | Yes | Save watched seconds |
| GET | `/api/progress/:playlistId` | Yes | Playlist progress snapshot |
| GET | `/api/progress/dashboard` | Yes | Dashboard metrics |
| GET | `/api/certificate` | Yes | User certificate gallery |
| GET | `/api/certificate/verify/:certificateId` | No | Public certificate verification |
| POST | `/api/certificate` | Yes | Manually issue certificate for complete playlist |
| POST | `/api/upload/avatar` | Yes | Upload avatar to Cloudinary |
| GET | `/api/admin/stats` | Admin | Platform analytics |
| GET | `/api/admin/users` | Admin | Paginated user list |
| PATCH | `/api/admin/users/:id/suspend` | Admin | Toggle user suspension |
| DELETE | `/api/admin/users/:id` | Admin | Hard delete user |
| GET | `/api/admin/categories` | Admin | All categories with counts |
| PATCH | `/api/admin/categories/:id` | Admin | Update category |
| POST | `/api/admin/categories` | Admin | Create category |

## 🎯 Demo Credentials

- Student Email: `demo@egurukulx.com`
- Student Password: `Demo@1234`
- Admin Email: `admin@egurukulx.com`
- Admin Password: `Admin@EGurukulX2026`
- These users are created by the Prisma seed script in `backend/prisma/seed.js`.
