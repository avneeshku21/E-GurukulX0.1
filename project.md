# E-GurukulX Technical Documentation

## 1. Project Summary

E-GurukulX is a full-stack learning platform inspired by the Gurukul tradition. Its main idea is simple: instead of leaving students with random educational videos and no structure, the platform turns public content into organized learning paths.

Users can:

- browse technical categories,
- discover videos from YouTube,
- save videos into personal playlists,
- watch videos inside the app,
- track watched progress,
- mark videos complete,
- keep notes while learning,
- build quiz-style revision notes,
- maintain streaks,
- earn certificates for completed playlists,
- verify certificates publicly,
- manage their profile and category preferences.

Admins can:

- view platform statistics,
- manage users,
- suspend or delete users,
- manage learning categories.

In short, E-GurukulX is a structured self-learning system built on top of public educational content, enriched with progress tracking, persistence, and administration.

---

## 2. Main Features

### Student Features

- Email/password authentication
- OAuth-ready login placeholders for Google and GitHub
- Category-based content discovery
- Playlist creation, rename, delete, reorder
- Add/remove videos from playlists
- Embedded YouTube playback
- Watch-progress saving
- Automatic video completion tracking
- Text, code, and quiz notes
- Dashboard metrics and streak display
- Certificates for completed playlists
- Public certificate verification
- Profile editing and avatar upload

### Admin Features

- Admin-only route protection
- Dashboard stats and user counts
- User moderation and suspension
- Category creation and updates

### System Features

- JWT-based authentication
- httpOnly auth cookie support
- Prisma ORM with PostgreSQL
- Cloudinary avatar upload
- YouTube API integration with cache
- Zod request validation
- Rate limiting on login

---

## 3. Tech Stack

| Layer | Tooling | Why it is used |
| --- | --- | --- |
| Frontend | React 18 | Component-based SPA UI |
| Frontend Build | Vite 5 | Fast dev server and production bundling |
| Routing | react-router-dom | Client-side route handling |
| Styling | Tailwind CSS | Utility-first responsive styling |
| API Client | Axios | HTTP requests and interceptors |
| Rich Text Editing | TipTap | Text notes editor |
| Code Editing | Monaco Editor | Code notes editor |
| Notifications | Sonner | Toast messages |
| Backend | Express 5 | REST API server |
| Validation | Zod | Request validation |
| ORM | Prisma | Database access layer |
| Database | PostgreSQL | Persistent relational data storage |
| Media | Cloudinary | Avatar upload and delivery |
| External Content | YouTube Data API | Video discovery |
| Auth | JWT + cookie-parser | Session and API auth |
| PDF | jsPDF + html2canvas | Certificate export |

---

## 4. What the Project Does End to End

This is the complete working flow from first visit to learning completion:

1. A user lands on the public landing page.
2. The user registers or logs in.
3. The frontend stores the returned JWT in local storage and the backend also sets an httpOnly cookie.
4. The app loads the current user session using `/api/auth/me`.
5. The user opens a category page and browses videos pulled from the backend.
6. The backend fetches those videos from YouTube or returns cached results from the database.
7. The user adds videos to a playlist.
8. The playlist player page loads playlist metadata and playlist videos.
9. The `VideoPlayer` component embeds YouTube and periodically sends watched time updates to the backend.
10. When a video reaches the completion threshold, the frontend calls the completion endpoint.
11. The backend marks the playlist video complete, recalculates playlist progress, updates the user streak, and may issue a certificate if the playlist reaches 100%.
12. The user can create notes linked either to the whole playlist or a specific playlist video.
13. Notes are stored in PostgreSQL and loaded with filters by type, search term, or playlist.
14. Completed playlists generate certificates that can be downloaded and verified publicly.
15. Admins can manage categories and users through admin-only pages and routes.

---

## 5. Frontend Architecture

The frontend is a React single-page application under `frontend/src`.

### Frontend Layers

- `main.jsx`: bootstraps React, router, auth, and theme providers.
- `App.jsx`: defines all routes.
- `context/`: global state providers.
- `lib/`: Axios client and helper utilities.
- `hooks/`: reusable local state and API hooks.
- `components/`: shared UI and feature components.
- `pages/`: route-level screens.

### Route Strategy

Routes are split into:

- public routes,
- auth routes,
- protected student routes,
- protected admin routes.

`ProtectedRoute` checks whether the user is authenticated.

`AdminRoute` checks whether the authenticated user has the `ADMIN` role.

### UI Strategy

The UI is built with reusable primitives like `Button`, `Modal`, `Tabs`, `ProgressBar`, `Skeleton`, and `Dropdown`. Feature components such as `VideoPlayer`, `NoteEditor`, and `PlaylistCard` build on those primitives.

---

## 6. Backend Architecture

The backend lives under `backend/server` and starts from `backend/server/index.js`.

### Backend Layers

- `index.js`: Express bootstrapping and route mounting.
- `routes/`: endpoint logic.
- `middleware/`: auth, validation, rate limiting.
- `validators/`: Zod schemas for request inputs.
- `utils/`: helpers for JWT, hashing, progress, streaks, and response shape.
- `services/`: external-service integration, mainly YouTube.
- `backend/src/lib/prisma.js`: Prisma singleton used by the route layer.

### Request Pipeline

1. Request enters Express.
2. CORS, JSON body parsing, and cookie parsing run.
3. For protected routes, `verifyToken` attaches `req.user`.
4. Zod validators reject bad payloads early.
5. Route handler performs Prisma queries and business logic.
6. Helpers normalize responses with `sendSuccess`, `sendError`, or `sendPaginated`.
7. Global error middleware handles thrown errors.

---

## 7. API Flow

The frontend talks only to the backend API, not directly to PostgreSQL, Cloudinary, or YouTube.

### Client Request Flow

1. A component or hook calls `get`, `post`, `patch`, `del`, or `uploadFile` from `frontend/src/lib/api.js`.
2. Axios sends requests to `/api/...`.
3. Vite proxy forwards requests to `http://localhost:5000` in development.
4. The Axios request interceptor adds the bearer token from local storage.
5. The backend route handles the request.
6. Prisma reads or writes the database.
7. A JSON response is returned.
8. The component or hook updates local React state.

### Error Flow

- `401`: local auth is cleared and the user is redirected to `/login`.
- `429`: a toast is shown for rate limiting.
- Validation errors: returned from route validation or route logic.

---

## 8. Database Flow

The database is PostgreSQL, accessed through Prisma.

### Main Entity Flow

- A `User` owns many `Playlist`, `Note`, and `Certificate` records.
- A `Playlist` contains many `PlaylistVideo` rows.
- A `Playlist` can optionally belong to a `Category`.
- A `Note` can link to a whole playlist or one specific playlist video.
- A `Certificate` belongs to a user and exactly one playlist.
- `PasswordResetToken` stores temporary reset links.
- `VideoApiCache` stores YouTube responses to reduce API calls.

### Write Examples

- Registering creates a `User`.
- Creating a playlist inserts `Playlist`.
- Adding a video inserts `PlaylistVideo` and updates playlist counts.
- Completing a video updates `PlaylistVideo`, updates `Playlist`, updates `User` streak fields, and may create a `Certificate`.
- Creating notes inserts `Note`.
- Password reset request inserts `PasswordResetToken`.

---

## 9. Authentication Flow

E-GurukulX uses JWT-based auth.

### Login Flow

1. User submits email and password.
2. Backend finds the user and compares password hash with bcrypt.
3. On success, backend generates a JWT.
4. Backend sets an httpOnly cookie named `edutrack_token`.
5. Backend also returns the token in the response body.
6. Frontend `AuthContext` saves the token in local storage and stores the user object.
7. Protected routes become accessible.

### Session Restore Flow

1. On app mount, `AuthContext` checks local storage for a token.
2. If a token exists, it calls `/api/auth/me`.
3. If valid, the user is restored into context.
4. If invalid, local auth state is cleared.

### Route Protection

- `ProtectedRoute` blocks unauthenticated users.
- `AdminRoute` blocks non-admin users.
- Backend protected routes also verify JWT using `verifyToken`, so UI protection is not the only protection.

### Password Reset Flow

1. User submits email on forgot-password page.
2. Backend creates a reset token and stores a hashed version in `PasswordResetToken`.
3. Backend logs the reset URL in development.
4. User opens reset page with `?token=...`.
5. Backend verifies token hash and expiry.
6. Backend updates the password hash and marks the token used.

---

## 10. State Management

State is handled mainly with React hooks and context rather than Redux.

### Global State

- `AuthContext`: user session, login, logout, register, refresh, updateUser.
- `ThemeContext`: dark mode / light mode state.

### Local Page State

Pages manage UI-specific state such as:

- selected tabs,
- open modals,
- current filters,
- form values,
- selected video,
- current note being edited.

### Reusable Data Hooks

- `usePlaylist`: playlist CRUD and reorder actions.
- `useNotes`: note CRUD and filtered loading.
- `useApi`: generic async request state helper.
- `useDebounce`: delays search input.
- `useLocalStorage`: syncs state with browser storage.

---

## 11. How Data Moves Through the Project

### Example: Add Video to Playlist

1. User clicks add-to-playlist in the frontend.
2. Frontend sends playlist video payload to `POST /api/playlist/:id/videos`.
3. Backend validates the body.
4. Backend checks playlist ownership.
5. Backend inserts a `PlaylistVideo` record.
6. Backend updates `Playlist.totalVideos` and `Playlist.progressPercent`.
7. Response returns the updated playlist.
8. Frontend hook updates local playlist state.

### Example: Watch Progress

1. `VideoPlayer` tracks current playback time.
2. Every 5 seconds it sends `PATCH /api/progress/watched`.
3. Backend ensures the user owns the video’s playlist.
4. Backend stores the highest watched time seen so far.
5. Frontend updates its progress bar from local state.

### Example: Complete Playlist and Issue Certificate

1. The last playlist video is marked complete.
2. Backend recounts completed videos.
3. Backend recalculates progress percent.
4. Backend updates user streak values.
5. If progress becomes 100 and no certificate was issued yet, backend creates a `Certificate`.
6. Frontend refreshes playlist data and shows the completion flow.

---

## 12. Deployment Process

### Backend Deployment

Requirements:

- Node.js runtime
- PostgreSQL database
- environment variables

Recommended steps:

1. Provision a PostgreSQL database, such as Neon.
2. Set backend env values: `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `VITE_YOUTUBE_API_KEY`, `VITE_APP_URL`, `ALLOWED_ORIGINS`.
3. Run `npm install` at repo root.
4. Run Prisma migration or push:
   - `npm run db:migrate`
   - or `npm run db:push`
5. Start the backend with `npm run dev:backend` locally or a production node command in hosting.

### Frontend Deployment

1. Build using `npm run build`.
2. Deploy the generated `frontend/dist` output.
3. Ensure frontend requests can reach the backend API.
4. Set public env vars only if needed through Vite.

### Important Deployment Note

In development, Vite proxies `/api` to port 5000. In production, you must either:

- deploy frontend and backend behind the same domain path, or
- adjust the API base URL strategy for separate domains.

---

## 13. Improvement and Optimization Suggestions

### Product Improvements

- Implement real email delivery for password reset.
- Add refresh-token rotation instead of relying on a long-lived token only.
- Add transcript ingestion and search.
- Add quiz scoring and spaced repetition.
- Add playlist sharing and collaboration.

### Frontend Improvements

- Introduce React Query or SWR for request caching and invalidation.
- Reduce large bundle chunks further, especially editor and PDF bundles.
- Add form libraries consistently across all forms.
- Add error boundaries around editor-heavy surfaces.

### Backend Improvements

- Add refresh-token persistence and revocation.
- Add stronger audit logging for admin actions.
- Add centralized service layer between routes and Prisma.
- Add pagination to more admin endpoints.
- Replace development-only password reset console logging with email delivery.

### Database Improvements

- Add more indexes for frequent filters.
- Add soft-delete strategy consistency for admin hard deletes.
- Store structured note content as JSON where appropriate instead of serialized strings.

### DevOps Improvements

- Add Docker support.
- Add CI for lint, build, Prisma validate, and test.
- Add ESLint config at repo root so the existing lint script works.
- Add unit and integration tests.

---

## 14. Folder-by-Folder Architecture

## Root Folder

This folder coordinates the monorepo. It contains the shared package configuration, documentation, and environment templates.

### Root Files

#### `.env.example`
- Purpose: template for environment values.
- Why it exists: helps developers know which variables are needed.
- Imports: none.
- Exports: none.
- Connection: copied and adapted into real environment files.

#### `.gitignore`
- Purpose: excludes generated files, secrets, and dependencies from git.
- Why it exists: prevents committing `node_modules`, secrets, and build output.
- Imports: none.
- Exports: none.
- Connection: used by git only.

#### `package.json`
- Purpose: root package manifest and command entry point.
- Why it exists: centralizes dependencies and scripts for frontend, backend, and Prisma.
- Imports: none.
- Exports: npm scripts and dependency metadata.
- Connection: developers run `npm run dev`, `npm run build`, `npm run db:*` from here.

#### `package-lock.json`
- Purpose: exact dependency lockfile.
- Why it exists: reproducible installs.
- Imports: none.
- Exports: exact version graph for npm.
- Connection: used automatically by npm.

#### `readme.md`
- Purpose: human-readable project overview.
- Why it exists: onboarding and setup guide.
- Imports: none.
- Exports: none.
- Connection: documents the project for developers and reviewers.

#### `project.md`
- Purpose: deep technical documentation.
- Why it exists: explains architecture, flows, and every project file.
- Imports: none.
- Exports: none.
- Connection: reference document for the whole codebase.

---

## `backend/`

The backend folder contains database schema, seed data, the API server, and the Prisma singleton.

### `backend/prisma/`

#### `backend/prisma/schema.prisma`
- Purpose: defines the database schema.
- Why it exists: Prisma needs a schema to generate the client and map models to PostgreSQL.
- Imports: environment variable `DATABASE_URL`.
- Exports: Prisma models and generated client shape.
- Connection: every route uses this indirectly through Prisma Client.

#### `backend/prisma/seed.js`
- Purpose: seed script for initial data.
- Why it exists: creates demo/admin/category baseline data for development.
- Imports: Prisma client and likely hashing helpers.
- Exports: script execution only.
- Connection: called through `npm run db:seed`.

### `backend/src/lib/`

#### `backend/src/lib/prisma.js`
- Purpose: Prisma singleton.
- Why it exists: prevents connection explosion during hot reload in development.
- Imports: `PrismaClient` from `@prisma/client`.
- Exports: default `prisma` instance.
- Connection: imported by backend routes.

### `backend/server/`

#### `backend/server/.env.example`
- Purpose: backend env template.
- Why it exists: documents backend-only required variables.
- Imports: none.
- Exports: none.
- Connection: copied into local env configuration.

#### `backend/server/package.json`
- Purpose: backend-local package manifest.
- Why it exists: supports direct backend development commands and metadata.
- Imports: none.
- Exports: npm metadata.
- Connection: useful when working inside `backend/server` directly.

#### `backend/server/index.js`
- Purpose: Express entry point.
- Why it exists: starts the API server, loads env, mounts routes, sets middleware, and handles errors.
- Imports: Express, CORS, cookie-parser, dotenv, all route modules.
- Exports: default Express app.
- Connection: invoked by `npm run dev:backend`.

### `backend/server/middleware/`

#### `backend/server/middleware/auth.middleware.js`
- Purpose: JWT verification and role authorization.
- Why it exists: protects private routes and attaches authenticated user info.
- Imports: JWT helpers and Prisma if needed.
- Exports: functions like `verifyToken`, role-check helpers.
- Connection: used by route modules.

#### `backend/server/middleware/rateLimit.middleware.js`
- Purpose: login throttling and lockout logic.
- Why it exists: reduces brute-force login attempts.
- Imports: Express middleware helpers and internal state structures.
- Exports: `loginRateLimit` middleware.
- Connection: applied in `auth.routes.js` login route.

#### `backend/server/middleware/validate.middleware.js`
- Purpose: Zod-based request validation.
- Why it exists: keeps route handlers clean and blocks bad payloads early.
- Imports: Zod schemas passed into the middleware.
- Exports: `validate` helper.
- Connection: used in auth, playlist, notes, and user routes.

### `backend/server/routes/`

#### `backend/server/routes/admin.routes.js`
- Purpose: admin analytics and moderation endpoints.
- Why it exists: separates admin-only server logic.
- Imports: Prisma, auth middleware, response helpers.
- Exports: default Express router.
- Connection: mounted at `/api/admin`, consumed by admin pages.

#### `backend/server/routes/auth.routes.js`
- Purpose: authentication endpoints.
- Why it exists: handles register, login, logout, current-user lookup, forgot password, and reset password.
- Imports: Prisma, auth middleware, validation middleware, JWT/hash utilities, user validators.
- Exports: default Express router.
- Connection: mounted at `/api/auth`, used by auth pages and `AuthContext`.

#### `backend/server/routes/certificate.routes.js`
- Purpose: certificate list, issue, and public verification.
- Why it exists: groups certificate-related business logic.
- Imports: Prisma, auth middleware, response helpers.
- Exports: default Express router.
- Connection: used by profile page, certificate page, playlist completion flow.

#### `backend/server/routes/notes.routes.js`
- Purpose: notes CRUD and filtered listing.
- Why it exists: stores learning notes separately from playlist logic.
- Imports: Prisma, auth middleware, validation middleware, response helpers, note validators.
- Exports: default Express router.
- Connection: used by `NotesPage`, `PlaylistPlayerPage`, and `NoteEditor`.

#### `backend/server/routes/playlist.routes.js`
- Purpose: playlist CRUD, add/remove videos, reorder videos.
- Why it exists: centralizes playlist ownership and progress-related updates.
- Imports: Prisma, auth middleware, validation middleware, progress helper, playlist validators.
- Exports: default Express router.
- Connection: used by `PlaylistsPage`, `PlaylistPlayerPage`, `PlaylistCard`, and add-to-playlist flows.

#### `backend/server/routes/progress.routes.js`
- Purpose: watch progress tracking and dashboard metrics.
- Why it exists: separates progress/streak/certificate logic from basic playlist CRUD.
- Imports: Prisma, auth middleware, response helpers, progress and streak helpers, certificate ID helper.
- Exports: default Express router.
- Connection: used mainly by `VideoPlayer` and `DashboardPage`.

#### `backend/server/routes/upload.routes.js`
- Purpose: avatar upload endpoint.
- Why it exists: handles file uploads and Cloudinary integration.
- Imports: Cloudinary config, multer, auth middleware, response helpers.
- Exports: default Express router.
- Connection: used by `ProfilePage` for avatar updates.

#### `backend/server/routes/user.routes.js`
- Purpose: user profile and account settings.
- Why it exists: keeps account management separate from auth session logic.
- Imports: Prisma, auth middleware, validation middleware, hash helpers, user validators.
- Exports: default Express router.
- Connection: used by `ProfilePage` and `AuthContext.updateUser`.

#### `backend/server/routes/video.routes.js`
- Purpose: category list and YouTube-backed video discovery.
- Why it exists: frontend needs a clean internal API instead of talking to YouTube directly.
- Imports: Prisma, YouTube service, response helpers, auth middleware where applicable.
- Exports: default Express router.
- Connection: used by `CategoryPage`, `DashboardPage`, and add-to-playlist UI.

### `backend/server/services/`

#### `backend/server/services/youtube.service.js`
- Purpose: YouTube search and caching service.
- Why it exists: route handlers should not contain raw external API orchestration.
- Imports: Axios or fetch logic, Prisma cache access, hashing helpers.
- Exports: YouTube retrieval functions.
- Connection: used by `video.routes.js`.

### `backend/server/utils/`

#### `backend/server/utils/hash.js`
- Purpose: password hashing and token/certificate helper generation.
- Why it exists: cryptographic operations should stay centralized.
- Imports: `bcryptjs`, `crypto`.
- Exports: password hash helpers, compare helper, reset-token hash helper, certificate ID generator.
- Connection: used by auth, user, and progress routes.

#### `backend/server/utils/jwt.js`
- Purpose: JWT creation and verification helpers.
- Why it exists: keeps token logic consistent across auth middleware and auth routes.
- Imports: `jsonwebtoken`.
- Exports: token generation and verification helpers.
- Connection: used by `auth.routes.js` and `auth.middleware.js`.

#### `backend/server/utils/progressCalculator.js`
- Purpose: playlist progress computation.
- Why it exists: avoids duplicating completion percentage logic.
- Imports: none or lightweight utilities.
- Exports: `calculateProgress` and related helpers.
- Connection: used by playlist and progress routes.

#### `backend/server/utils/response.js`
- Purpose: standard API response wrappers.
- Why it exists: keeps response shape consistent across routes.
- Imports: none.
- Exports: `sendSuccess`, `sendError`, `sendPaginated`, `buildPagination`.
- Connection: used by almost every route.

#### `backend/server/utils/streakCalculator.js`
- Purpose: streak update rules.
- Why it exists: keeps day-based streak business logic isolated.
- Imports: date helpers or built-in date logic.
- Exports: `calculateStreak`.
- Connection: used by `progress.routes.js`.

### `backend/server/validators/`

#### `backend/server/validators/note.validator.js`
- Purpose: validate note create/update payloads.
- Why it exists: notes support several modes and need strict schema checks.
- Imports: Zod.
- Exports: note schemas.
- Connection: used by `notes.routes.js`.

#### `backend/server/validators/playlist.validator.js`
- Purpose: validate playlist create/update/add-video/reorder inputs.
- Why it exists: playlist operations have structured bodies.
- Imports: Zod.
- Exports: playlist schemas.
- Connection: used by `playlist.routes.js`.

#### `backend/server/validators/user.validator.js`
- Purpose: validate register, login, password, profile, forgot/reset password payloads.
- Why it exists: user-related forms need consistent validation.
- Imports: Zod.
- Exports: user schemas.
- Connection: used by auth and user routes.

---

## `frontend/`

The frontend folder contains the Vite app, React pages, shared components, hooks, contexts, and CSS.

### Frontend Config Files

#### `frontend/index.html`
- Purpose: Vite HTML entry.
- Why it exists: contains the DOM root for React.
- Imports: built bundle scripts injected by Vite.
- Exports: none.
- Connection: browser entry point.

#### `frontend/jsconfig.json`
- Purpose: editor path and JavaScript tooling configuration.
- Why it exists: improves IDE resolution.
- Imports: none.
- Exports: none.
- Connection: used by editors and tooling.

#### `frontend/postcss.config.js`
- Purpose: PostCSS configuration.
- Why it exists: enables Tailwind CSS processing.
- Imports: PostCSS plugins.
- Exports: config object.
- Connection: used during build.

#### `frontend/tailwind.config.js`
- Purpose: Tailwind theme configuration.
- Why it exists: defines colors, fonts, animations, shadows, screens, and content scan paths.
- Imports: Node path utilities.
- Exports: Tailwind config object.
- Connection: used during CSS build.

#### `frontend/vite.config.js`
- Purpose: Vite project configuration.
- Why it exists: defines React plugin, aliasing, env directory, dev proxy, and chunk splitting.
- Imports: Vite, React plugin, path utilities.
- Exports: Vite config.
- Connection: used by `npm run dev` and `npm run build`.

### `frontend/src/`

#### `frontend/src/index.css`
- Purpose: global CSS and Tailwind imports.
- Why it exists: sets the application’s design baseline.
- Imports: Tailwind directives and any global utility styles.
- Exports: none.
- Connection: imported once by `main.jsx`.

#### `frontend/src/main.jsx`
- Purpose: React startup file.
- Why it exists: renders `App` into the DOM with router and providers.
- Imports: React, ReactDOM, `BrowserRouter`, `App`, `AuthProvider`, `ThemeProvider`, `index.css`.
- Exports: none.
- Connection: frontend runtime entry.

#### `frontend/src/App.jsx`
- Purpose: route map.
- Why it exists: centralizes all public, auth, student, admin, and fallback routes.
- Imports: router components, layouts, route guards, all page components.
- Exports: default `App` component.
- Connection: core route composition layer.

### `frontend/src/context/`

#### `frontend/src/context/AuthContext.jsx`
- Purpose: global auth state and actions.
- Why it exists: many parts of the app need the current user and auth helpers.
- Imports: React context hooks and API helpers.
- Exports: `AuthProvider`, `useAuth`, default context.
- Connection: used by route guards, navbar, profile flows, and auth pages.

#### `frontend/src/context/ThemeContext.jsx`
- Purpose: dark/light theme management.
- Why it exists: central theme state should not be reimplemented in each page.
- Imports: React hooks and local storage access.
- Exports: `ThemeProvider`, `useTheme`, default context.
- Connection: used by layouts and components that react to theme.

### `frontend/src/hooks/`

#### `frontend/src/hooks/useApi.js`
- Purpose: generic async request lifecycle helper.
- Why it exists: standardizes loading, success, and error state around API calls.
- Imports: React hooks.
- Exports: custom hook.
- Connection: reusable across pages/components.

#### `frontend/src/hooks/useDebounce.js`
- Purpose: debounce changing values.
- Why it exists: avoids firing filtering or search requests on every keystroke.
- Imports: React hooks.
- Exports: custom hook.
- Connection: used in search-heavy pages like notes.

#### `frontend/src/hooks/useLocalStorage.js`
- Purpose: state synced to local storage.
- Why it exists: persistent UI/user preferences.
- Imports: React hooks.
- Exports: custom hook.
- Connection: useful for theme or other persistent client state.

#### `frontend/src/hooks/useNotes.js`
- Purpose: notes fetch and mutation abstraction.
- Why it exists: removes duplicated notes API logic from pages.
- Imports: React hooks and API helpers.
- Exports: `useNotes`, default hook.
- Connection: used by notes-related pages.

#### `frontend/src/hooks/usePlaylist.js`
- Purpose: playlist fetch and mutation abstraction.
- Why it exists: removes duplicated playlist API logic from pages/components.
- Imports: React hooks and API helpers.
- Exports: `usePlaylist`, default hook.
- Connection: used by playlist pages and cards.

### `frontend/src/lib/`

#### `frontend/src/lib/api.js`
- Purpose: Axios wrapper with interceptors.
- Why it exists: one consistent HTTP client for the whole frontend.
- Imports: `axios`.
- Exports: default Axios instance plus `get`, `post`, `patch`, `del`, `uploadFile` helpers.
- Connection: used across contexts, hooks, pages, and components.

#### `frontend/src/lib/prisma.js`
- Purpose: placeholder/shared Prisma helper file in frontend space.
- Why it exists: likely copied from a server-side pattern or kept for compatibility/tooling.
- Imports: Prisma client patterns.
- Exports: Prisma singleton-like value.
- Connection: not part of the normal browser runtime flow and should be treated carefully.

#### `frontend/src/lib/utils.js`
- Purpose: shared formatting and class helpers.
- Why it exists: avoids duplicate formatting logic.
- Imports: utility libraries like `clsx` or `tailwind-merge`.
- Exports: helpers such as `cn`, `formatDuration`, `formatViewCount`, date formatting, truncation helpers.
- Connection: used throughout the UI.

### `frontend/src/components/`

#### `frontend/src/components/AddToPlaylistModal.jsx`
- Purpose: modal for choosing or creating a playlist while adding a video.
- Why it exists: the add-to-playlist flow is a repeated interaction.
- Imports: modal/button/ui helpers and playlist API calls.
- Exports: default component.
- Connection: used from video browsing pages/cards.

#### `frontend/src/components/CategoryCard.jsx`
- Purpose: category summary card.
- Why it exists: category pages and landing/dashboard need reusable category presentation.
- Imports: UI helpers and routing links.
- Exports: default component.
- Connection: used where categories are listed.

#### `frontend/src/components/CertificateCard.jsx`
- Purpose: certificate display card.
- Why it exists: certificates appear in profile and completion flows.
- Imports: UI helpers, PDF/export helpers if present.
- Exports: default component.
- Connection: used by profile and playlist completion views.

#### `frontend/src/components/DashboardHeatmap.jsx`
- Purpose: activity heatmap.
- Why it exists: visualizes learning consistency on the dashboard.
- Imports: utility/date helpers.
- Exports: default component.
- Connection: used by `DashboardPage`.

#### `frontend/src/components/NoteCard.jsx`
- Purpose: compact note preview card.
- Why it exists: notes must be listable in pages and playlist sidebars.
- Imports: UI helpers and formatting utilities.
- Exports: default component.
- Connection: used by `NotesPage` and `PlaylistPlayerPage`.

#### `frontend/src/components/NoteEditor.jsx`
- Purpose: multi-mode note editor.
- Why it exists: text, code, and quiz note types need one reusable editor experience.
- Imports: React hooks, `Modal`, `Button`, `Toast`, API helpers, `useTheme`, TipTap, Monaco.
- Exports: default component.
- Connection: used in notes pages and playlist page note creation/edit flows.

#### `frontend/src/components/PlaylistCard.jsx`
- Purpose: playlist summary card with rename/delete controls.
- Why it exists: playlists need consistent display in grids and dashboards.
- Imports: React hooks, progress UI, badge UI, dropdown/confirm UI, utility helpers.
- Exports: default component.
- Connection: used by `PlaylistsPage` and other playlist listings.

#### `frontend/src/components/StatsCard.jsx`
- Purpose: dashboard/admin statistic card.
- Why it exists: repeated metric display pattern.
- Imports: card UI and icon content.
- Exports: default component.
- Connection: used in dashboards.

#### `frontend/src/components/VideoCard.jsx`
- Purpose: video discovery card.
- Why it exists: category and dashboard pages need consistent video display.
- Imports: UI helpers, routing, playlist modal or action buttons.
- Exports: default component.
- Connection: used in category and recommendation sections.

#### `frontend/src/components/VideoPlayer.jsx`
- Purpose: YouTube player wrapper with progress tracking.
- Why it exists: watching is the core learning interaction and needs custom progress behavior.
- Imports: React hooks, `react-youtube`, `Button`, `Toast`, utility helpers, progress API helpers.
- Exports: default component.
- Connection: used by `PlaylistPlayerPage`.

### `frontend/src/components/layout/`

#### `frontend/src/components/layout/AuthLayout.jsx`
- Purpose: wrapper layout for login/register/forgot/reset pages.
- Why it exists: auth pages share consistent structure.
- Imports: router outlet and shared brand/presentation UI.
- Exports: default component.
- Connection: used by `App.jsx` auth route branch.

#### `frontend/src/components/layout/Footer.jsx`
- Purpose: site footer.
- Why it exists: shared footer UI.
- Imports: links and basic UI.
- Exports: default component.
- Connection: used by layouts.

#### `frontend/src/components/layout/MainLayout.jsx`
- Purpose: main authenticated/public site shell.
- Why it exists: shared navbar, page container, and footer behavior belong in one place.
- Imports: `Outlet`, `Navbar`, `Footer`, theme/auth-aware UI.
- Exports: default component.
- Connection: used by both public and protected route groups.

#### `frontend/src/components/layout/Navbar.jsx`
- Purpose: global top navigation.
- Why it exists: route navigation and auth-aware actions are shared app-wide.
- Imports: router links, auth context, avatar/theme controls.
- Exports: default component.
- Connection: used in `MainLayout`.

#### `frontend/src/components/layout/PageHeader.jsx`
- Purpose: reusable page title/subtitle/action header.
- Why it exists: many pages need a consistent heading block.
- Imports: UI helpers.
- Exports: default component.
- Connection: used by pages where needed.

### `frontend/src/components/routing/`

#### `frontend/src/components/routing/AdminRoute.jsx`
- Purpose: admin role guard.
- Why it exists: admin pages require both auth and role checks.
- Imports: `Navigate`, `Outlet`, `useAuth`.
- Exports: default component.
- Connection: used in `App.jsx`.

#### `frontend/src/components/routing/ProtectedRoute.jsx`
- Purpose: auth guard.
- Why it exists: private pages should not render for guests.
- Imports: `Navigate`, `Outlet`, `useAuth`, loading UI.
- Exports: default component.
- Connection: used in `App.jsx`.

### `frontend/src/components/ui/`

#### `frontend/src/components/ui/Avatar.jsx`
- Purpose: avatar rendering component.
- Why it exists: profile images are used in multiple places.
- Imports: utility helpers.
- Exports: default component.
- Connection: used in navbar, profile, admin views.

#### `frontend/src/components/ui/Badge.jsx`
- Purpose: small status/label chip.
- Why it exists: categories, statuses, and tags reuse this pattern.
- Imports: class helpers.
- Exports: default component.
- Connection: used in cards and tables.

#### `frontend/src/components/ui/Button.jsx`
- Purpose: shared button primitive.
- Why it exists: centralizes variants, sizes, loading states, and icon placement.
- Imports: utility helpers and spinner component.
- Exports: default component.
- Connection: used almost everywhere.

#### `frontend/src/components/ui/Card.jsx`
- Purpose: container surface primitive.
- Why it exists: cards appear throughout the UI.
- Imports: utility helpers.
- Exports: default component.
- Connection: base presentation component.

#### `frontend/src/components/ui/ConfirmDialog.jsx`
- Purpose: reusable confirmation modal.
- Why it exists: delete and destructive confirmations should be standardized.
- Imports: `Modal`, `Button`.
- Exports: default component.
- Connection: used in playlist and note deletion flows.

#### `frontend/src/components/ui/Dropdown.jsx`
- Purpose: reusable dropdown menu.
- Why it exists: avoids custom one-off option menus.
- Imports: React hooks and utility helpers.
- Exports: default component.
- Connection: used by playlist cards and player menus.

#### `frontend/src/components/ui/EmptyState.jsx`
- Purpose: empty-list placeholder UI.
- Why it exists: empty pages need consistent messaging.
- Imports: `Button` or simple UI wrappers.
- Exports: default component.
- Connection: used by playlists, notes, and other data views.

#### `frontend/src/components/ui/Input.jsx`
- Purpose: styled input wrapper.
- Why it exists: auth and settings forms reuse input styling and error display.
- Imports: utility helpers.
- Exports: default component.
- Connection: used by forms including reset password.

#### `frontend/src/components/ui/LoadingSpinner.jsx`
- Purpose: standard loading indicator.
- Why it exists: consistent loader appearance.
- Imports: spinner styles/helpers.
- Exports: default component.
- Connection: used by route guards and pages.

#### `frontend/src/components/ui/Modal.jsx`
- Purpose: base modal dialog.
- Why it exists: editor, create, and confirm flows need shared overlay behavior.
- Imports: React portal/hooks and utility helpers.
- Exports: default component.
- Connection: used by note editor, create playlist flow, and other dialogs.

#### `frontend/src/components/ui/ProgressBar.jsx`
- Purpose: progress visualization.
- Why it exists: playlist and dashboard progress is a core metric.
- Imports: utility helpers.
- Exports: default component.
- Connection: used in playlist cards and player header.

#### `frontend/src/components/ui/Skeleton.jsx`
- Purpose: loading placeholder shapes.
- Why it exists: avoids jarring layout shifts while data loads.
- Imports: utility helpers.
- Exports: `Skeleton` and related variations.
- Connection: used by many pages.

#### `frontend/src/components/ui/Spinner.jsx`
- Purpose: minimal spinner primitive.
- Why it exists: lower-level loading icon.
- Imports: none or utility helpers.
- Exports: default spinner component.
- Connection: used by `Button` or loading states.

#### `frontend/src/components/ui/Tabs.jsx`
- Purpose: tab-switching UI.
- Why it exists: notes and player info sections need reusable tabs.
- Imports: utility helpers.
- Exports: default component.
- Connection: used by `NotesPage`, `PlaylistPlayerPage`, and others.

#### `frontend/src/components/ui/Toast.jsx`
- Purpose: toast wrapper.
- Why it exists: central notification API for the app.
- Imports: Sonner.
- Exports: toast object or wrapper helpers.
- Connection: used throughout the frontend.

### `frontend/src/pages/`

#### `frontend/src/pages/LandingPage.jsx`
- Purpose: public marketing/home page.
- Why it exists: gives visitors an overview before login.
- Imports: layout content, CTA buttons, category/features components.
- Exports: default page component.
- Connection: route `/`.

#### `frontend/src/pages/DashboardPage.jsx`
- Purpose: learner dashboard.
- Why it exists: central post-login overview of progress, playlists, and suggestions.
- Imports: API helpers, stats cards, heatmap, video/playlist components.
- Exports: default page component.
- Connection: route `/dashboard`.

#### `frontend/src/pages/CategoryPage.jsx`
- Purpose: category-specific video browsing page.
- Why it exists: categories are the main entry into content discovery.
- Imports: router params, API helpers, `VideoCard`, playlist modal.
- Exports: default page component.
- Connection: route `/category/:slug`.

#### `frontend/src/pages/CertificateVerifyPage.jsx`
- Purpose: public certificate verification screen.
- Why it exists: certificates need a public trust-check flow.
- Imports: route params and certificate API helpers.
- Exports: default page component.
- Connection: route `/verify/:certificateId`.

#### `frontend/src/pages/NotesPage.jsx`
- Purpose: all-notes management page.
- Why it exists: users need a centralized place to search, edit, and delete notes.
- Imports: `NoteCard`, `NoteEditor`, `Tabs`, `ConfirmDialog`, `useNotes`, debounce hook, API helpers.
- Exports: default page component.
- Connection: route `/notes`.

#### `frontend/src/pages/NotFoundPage.jsx`
- Purpose: 404 page.
- Why it exists: unmatched routes need a graceful fallback.
- Imports: router links and CTA buttons.
- Exports: default page component.
- Connection: catch-all route.

#### `frontend/src/pages/PlaylistPlayerPage.jsx`
- Purpose: playlist learning page.
- Why it exists: this is the core study experience combining video playback, progress, reorder, and notes.
- Imports: router hooks, `VideoPlayer`, `NoteEditor`, `NoteCard`, `CertificateCard`, `Tabs`, `ProgressBar`, `Dropdown`, `ConfirmDialog`, hooks and API helpers.
- Exports: default page component.
- Connection: route `/playlist/:id`.

#### `frontend/src/pages/PlaylistsPage.jsx`
- Purpose: all-playlists overview.
- Why it exists: users need to manage personal learning collections.
- Imports: `PlaylistCard`, `Tabs`, `Modal`, `Button`, `EmptyState`, `usePlaylist`, API helpers.
- Exports: default page component.
- Connection: route `/playlists`.

#### `frontend/src/pages/ProfilePage.jsx`
- Purpose: user profile and settings page.
- Why it exists: lets users manage account details, avatar, social links, password, categories, and certificates.
- Imports: auth context, upload/user/certificate endpoints, avatar and UI components.
- Exports: default page component.
- Connection: route `/profile`.

### `frontend/src/pages/admin/`

#### `frontend/src/pages/admin/AdminCategoriesPage.jsx`
- Purpose: admin category management page.
- Why it exists: categories drive discovery and need admin maintenance.
- Imports: admin API helpers, modals, forms, tables/cards.
- Exports: default page component.
- Connection: route `/admin/categories`.

#### `frontend/src/pages/admin/AdminDashboardPage.jsx`
- Purpose: admin analytics overview.
- Why it exists: admins need platform-level visibility.
- Imports: admin stats API and reusable metric components.
- Exports: default page component.
- Connection: route `/admin`.

#### `frontend/src/pages/admin/AdminUsersPage.jsx`
- Purpose: admin user management.
- Why it exists: suspension and deletion should be accessible only to admins.
- Imports: admin user API helpers, tables/modals/confirm UI.
- Exports: default page component.
- Connection: route `/admin/users`.

### `frontend/src/pages/auth/`

#### `frontend/src/pages/auth/ForgotPasswordPage.jsx`
- Purpose: request password reset page.
- Why it exists: starts the recovery flow.
- Imports: `Input`, `Button`, toast, auth API helper.
- Exports: default page component.
- Connection: route `/forgot-password`.

#### `frontend/src/pages/auth/LoginPage.jsx`
- Purpose: login screen.
- Why it exists: entry into authenticated use.
- Imports: auth context, inputs, buttons, links, toast helpers.
- Exports: default page component.
- Connection: route `/login`.

#### `frontend/src/pages/auth/RegisterPage.jsx`
- Purpose: sign-up screen.
- Why it exists: user onboarding.
- Imports: auth context, input/button helpers, validation UI.
- Exports: default page component.
- Connection: route `/register`.

#### `frontend/src/pages/auth/ResetPasswordPage.jsx`
- Purpose: set a new password using a reset token.
- Why it exists: completes the password recovery flow.
- Imports: router search params, `Input`, `Button`, toast, auth API helpers.
- Exports: default page component.
- Connection: route `/reset-password`.

---

## 15. Important Components and Functions

### `AuthProvider`
- Central auth controller.
- Restores session on app load.
- Exposes login, register, logout, refresh, updateUser.

### `api.js` interceptors
- Injects the JWT into outgoing requests.
- Handles `401` by clearing the session and redirecting.
- Handles `429` with a toast.

### `VideoPlayer`
- Wraps YouTube playback.
- Sends watched-time updates every 5 seconds.
- Automatically marks videos complete after threshold.

### `NoteEditor`
- Handles three note modes.
- Text mode uses TipTap.
- Code mode uses Monaco.
- Quiz mode uses a question/answer builder.

### `usePlaylist`
- Central hook for playlist API logic.
- Supports create, rename, delete, fetch, add video, remove video, reorder.

### `useNotes`
- Central hook for note API logic.
- Supports filtered fetch, create, update, delete.

### `progress.routes.js`
- One of the most important backend files.
- Connects video completion to playlist progress, streak updates, and certificate generation.

### `youtube.service.js`
- Keeps external API handling out of routes.
- Caches responses so the system does not over-call YouTube.

---

## 16. Complete System Flow Diagram in Words

### Frontend to Backend

User action -> React page/component -> custom hook or direct API helper -> Axios instance -> `/api` route -> backend middleware -> route handler -> Prisma/service -> database/external API -> JSON response -> React state update -> UI rerender

### Authentication

Login form -> `AuthContext.login()` -> `POST /api/auth/login` -> JWT created -> cookie set + token returned -> local storage updated -> `ProtectedRoute` unlocks private pages

### Learning

Category page -> videos API -> playlist add -> playlist page -> video playback -> progress endpoint -> database progress update -> dashboard/profile/certificate data update

### Notes

Open note editor -> save note -> `POST/PATCH /api/notes` -> note stored -> notes hook refreshes -> note cards rerender

---

## 17. Beginner-Friendly Mental Model

If you are new to the project, think of it in five blocks:

1. **Pages** render screens.
2. **Components** render reusable UI pieces.
3. **Hooks and Context** manage client-side state and API actions.
4. **Routes** on the backend define what the server can do.
5. **Prisma models** define what data exists and how it relates.

The main business loop is:

- discover videos,
- add to playlist,
- watch and track progress,
- write notes,
- complete playlists,
- earn certificates.

That is the core of E-GurukulX.