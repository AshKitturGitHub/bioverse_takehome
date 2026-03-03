# Intake Questionnaire System

Web app for completing medical intake questionnaires and reviewing answers in an admin panel.

## Tech Stack

### Frontend
- Next.js (React, App Router)
- TypeScript
- Tailwind CSS
- `localStorage` for lightweight session state only (username/role)

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL (hosted on Neon)

## Implemented Features

### User Flow
- Login page with username/password and role-based routing
	- `USER` -> questionnaire selection
	- `ADMIN` -> admin panel
- Questionnaire selection page with all available intakes
- Questionnaire detail page that:
	- renders questions from DB
	- supports text and MCQ inputs
	- supports multi-select questions ("Select all that apply")
	- validates non-empty / non-whitespace answers
	- submits answers and returns to questionnaire selection
- Prefill behavior for previously answered shared questions

### Admin Flow
- Admin table with usernames + completed questionnaire counts
- Click row to open modal with answered questionnaires
- Displays responses in `Q: ... A: ...` format

## Database + Seeding

- Prisma schema and migrations define the DB model
- `prisma/seed.ts` loads CSV data into DB and seeds test users
- `scripts/verify-seed.ts` checks table counts to confirm successful setup

## Project Structure

- `src/` -> Express backend
- `prisma/` -> Prisma schema, migrations, seed script
- `web/` -> Next.js frontend
- `data/` -> questionnaire CSV files
- `scripts/` -> helper scripts

## Local Setup

### 1) Install dependencies

From repo root:

```bash
npm install
npm --prefix web install
```

### 2) Configure backend DB URL

Create/update root `.env`:

```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
```

### 3) Migrate + seed

From repo root:

```bash
npm run prisma:migrate -- --name init
npm run db:seed
```

### 4) Configure frontend API URL

Create `web/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000"
```

### 5) Run app (2 terminals)

Terminal A (repo root):

```bash
npm run dev:api
```

Terminal B (`web/`):

```bash
npm run dev
```

Open: `http://localhost:3000`

## Seeded Test Accounts

- `user1 / password123` (USER)
- `user2 / password123` (USER)
- `admin / admin123` (ADMIN)


