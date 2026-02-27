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

## Data Model
- **User**: id, name, surname, email, dailyHours
- **Client**: id, name, vat (partita IVA)
- **Project**: id, name, clientId (FK -> Client), notes
- **Task**: id, projectId (FK -> Project), name, startDate, endDate, plannedHours, assignedUserIds[]
- **TimeEntry**: id, userId (FK -> User), date, projectId (FK -> Project), taskId (FK -> Task), hours, note

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
- `client/src/pages/` - Dashboard, Clients, Projects, Tasks, TimeEntries, Users pages

## API Endpoints
All prefixed with `/api/`:
- GET/POST `/users`, GET/PATCH/DELETE `/users/:id`
- GET/POST `/clients`, GET/PATCH/DELETE `/clients/:id`
- GET/POST `/projects`, GET/PATCH/DELETE `/projects/:id`
- GET/POST `/tasks`, GET/PATCH/DELETE `/tasks/:id`
- GET/POST `/time-entries`, GET/PATCH/DELETE `/time-entries/:id`

## Running
`npm run dev` starts Express + Vite dev server on port 5000
