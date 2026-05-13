# E-GurukulX Run Commands

## Prerequisites

- Node.js installed
- npm installed
- PostgreSQL connection string configured in `backend/.env`
- Required backend environment variables configured in `backend/.env`

## 1. Install Dependencies

Run this once from the project root:

```powershell
cd D:\EduAI
npm install
```

## 2. Prepare the Database

`npm run dev:backend` now loads `backend/.env`, runs Prisma schema sync automatically, and then starts the server.

You only need to run a manual database command when:

- you want to apply schema changes yourself,
- you want migration files,
- or you want to seed fresh data.

Manual schema sync command:

```powershell
cd D:\EduAI
npm run db:push
```

If you want migration files instead of direct schema push:

```powershell
cd D:\EduAI
npm run db:migrate
```

Optional seed data:

```powershell
cd D:\EduAI
npm run db:seed
```

## 3. Run the Backend

Open terminal 1:

```powershell
cd D:\EduAI
npm run dev:backend
```

This command now does two things automatically:

1. syncs Prisma schema to the database,
2. starts the backend server.

Backend runs at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

## 4. Run the Frontend

Open terminal 2:

```powershell
cd D:\EduAI
npm run dev
```

Frontend runs at:

```text
http://localhost:3000
```

If port `3000` is already busy, Vite will automatically use the next free port such as `3001` instead of failing.

## 5. How Local Routing Works

- Frontend uses Vite on port `3000` by default and automatically falls back to the next free local port in development
- Backend uses Express on port `5000`
- Requests starting with `/api` are proxied by Vite to the backend during development

## 6. Full Quick Start

Terminal 1:

```powershell
cd D:\EduAI
npm run dev:backend
```

Terminal 2:

```powershell
cd D:\EduAI
npm run dev
```

Open:

```text
http://localhost:3000
```

If `3000` is already occupied, open the alternate port printed by Vite in the terminal.

## 7. Common Problems

### Database connection error

Check `DATABASE_URL` in `backend/.env`.

### Prisma schema not applied

This usually gets handled automatically by:

```powershell
cd D:\EduAI
npm run dev:backend
```

If needed, you can still run it manually:

```powershell
cd D:\EduAI
npm run db:push
```

### Port already in use

Frontend now automatically switches to the next free local port if `3000` is busy.

If backend port `5000` is busy, free that port or change the backend port configuration.

### Backend starts but frontend API calls fail

Make sure the backend is running before starting the frontend.

### Features like avatar upload or video fetch do not work

Check these env keys in `backend/.env`:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `VITE_YOUTUBE_API_KEY`