# TimeTracker - Gestione Progetti e Time Tracking

## Overview
Applicazione web full-stack per la gestione di progetti e il tracciamento delle ore lavorative del team. Sviluppata con React + Express + PostgreSQL. Stile visivo futuristico robotico con tema cyberpunk (cyan/teal primary, dark mode default).

## Architecture
- **Frontend**: React SPA con Vite, Tailwind CSS, Shadcn UI, Wouter per routing
- **Backend**: Express.js con API REST
- **Database**: PostgreSQL con Drizzle ORM
- **State Management**: TanStack React Query

## Visual Theme
- **Fonts**: Space Grotesk (sans), JetBrains Mono (mono)
- **Colors**: Cyan/teal primary (hue 185), dark backgrounds (hue 210)
- **Style**: Futuristic robotic - monospace labels, uppercase tracking, tech-inspired decorations
- **Dark mode default**: HTML starts with `class="dark"`, localStorage toggle via ThemeToggle component
- **Custom CSS**: Styled scrollbars, selection highlight, glow effects on hover

## Authentication
- **Login "ponte"**: Simple session-based auth via express-session + connect-pg-simple
- Default credentials: admin / admin (email="admin", password="admin")
- Session stored in PostgreSQL via `connect-pg-simple`
- Auth routes: POST `/api/auth/login`, POST `/api/auth/logout`, GET `/api/auth/me`
- All `/api/*` routes (except auth) protected by `requireAuth` middleware
- Frontend shows login page when unauthenticated; header shows "Loggato come: Name Surname" + logout button
- Password field stored as plaintext (ponte/bridge login, not production-grade)

## Data Model
- **User**: id, name, surname, email, password, dailyHours
- **Client**: id, name, vat (partita IVA)
- **Project**: id, name, clientId (FK -> Client), notes
- **Task**: id, projectId (FK -> Project), name, startDate, endDate, plannedHours, assignedUserIds[], note
- **TimeEntry**: id, userId (FK -> User), date, projectId (FK -> Project), taskId (FK -> Task), hours, note
- **Absence**: id, userId (FK -> User), date (unique per user+date)

## Key Files
- `shared/schema.ts` - Drizzle schema + Zod validation + TypeScript types
- `server/db.ts` - Database connection pool
- `server/storage.ts` - DatabaseStorage implementing IStorage interface
- `server/routes.ts` - All REST API endpoints (CRUD for each entity)
- `server/seed.ts` - Seed data (4 users, 3 clients, 4 projects, 6 tasks, 10 time entries)
- `client/src/App.tsx` - Main app with sidebar layout and routing
- `client/src/index.css` - Futuristic theme CSS variables (light + dark mode)
- `client/src/components/app-sidebar.tsx` - Navigation sidebar with robotic branding
- `client/src/components/theme-toggle.tsx` - Dark/light mode toggle (defaults to dark)
- `client/src/pages/` - Dashboard, Clients, Projects, ProjectDetail, Tasks, TimeEntries, Users, Login pages
- `client/src/pages/project-detail.tsx` - Project detail page with task CRUD (table, create/edit/delete with confirmation)

## API Endpoints
All prefixed with `/api/`:
- POST `/auth/login`, POST `/auth/logout`, GET `/auth/me` (no auth required)
- GET/POST `/users`, GET/PATCH/DELETE `/users/:id` (auth required)
- GET/POST `/clients`, GET/PATCH/DELETE `/clients/:id` (auth required)
- GET/POST `/projects`, GET/PATCH/DELETE `/projects/:id` (auth required)
- GET/POST `/tasks`, GET/PATCH/DELETE `/tasks/:id` (auth required)
- GET/POST `/time-entries`, GET/PATCH/DELETE `/time-entries/:id` (auth required)
- GET/POST `/absences`, DELETE `/absences/:userId/:date` (auth required)

## Business Rules
- **Time Entry Validation**: hours must be > 0 and ≤ user.dailyHours (server-side enforced)
- **Absence Blocking**: if a user has an absence record for a date, time entries cannot be created for that date
- **Rendicontazione Calendar**: time entries page has 3 views: Giorno (daily detail with CRUD + absence toggle), Settimana (weekly calendar grid with hours per day + quick add), Mese (monthly calendar grid with hours totals). Click any day cell to drill into daily view. Navigation arrows move by day/week/month. Period totals shown for each view.
- **Dashboard KPIs**: Two prominent cards (Ore Previste = sum plannedHours, Ore Rendicontate = sum timeEntries.hours) with filter toggle: "Tutti i progetti" vs "Solo in corso". Bar chart shows ore rendicontate per progetto with planned hours marker line. Stat cards for Team, Clienti, Progetti, In Corso, Tasks, Completamento%. Recent log entries sidebar.
- **Cascade Deletes**: deleteUser→timeEntries+absences; deleteProject→tasks+timeEntries; deleteClient→projects; deleteTask→timeEntries

## Running
`npm run dev` starts Express + Vite dev server on port 5000
