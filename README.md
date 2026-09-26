# CodeYoung Trial-Class Booking Platform

A full-stack trial-class booking platform built with React, TypeScript, Node.js, Express, PostgreSQL, and Prisma, engineered to handle multi-timezone scheduling, daylight-saving time transitions, and concurrent booking assignments accurately without timezone drift or double-booking.

---

## ⚡ Quick Start: How to Navigate & Run the Project

### 1. Prerequisites
- **Node.js**: `v18.x` or `v20.x` or higher
- **npm**: `v9.x` or higher
- **PostgreSQL**: Running locally or via Docker

---

### 2. How to Navigate the Project
The repository is structured as an **npm monorepo**:
```bash
# Root Directory (Monorepo root for commands)
d:\code_young\

# Frontend Workspace (React + Vite + Tailwind CSS)
cd client

# Backend Workspace (Node.js + Express + Prisma)
cd server
```

---

### 3. Step-by-Step Setup & Run Commands

Open your terminal in the root `code_young` directory and run:

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Configure Environment Variables
Create your `.env` file from `.env.example`:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Linux/macOS/Git Bash:
cp .env.example .env
```
*(Ensure your `DATABASE_URL` matches your local PostgreSQL credentials in `.env`)*

#### Step 3: Initialize Database & Seed Mentors
```bash
# Generate Prisma Client
npm run prisma:generate

# Run Database Migrations
npx prisma migrate deploy

# Seed Admin & 10 Mentors
npm run prisma:seed
```

#### Step 4: Run the Application (Concurrent Dev Servers)
```bash
npm run dev
```
> Both the React frontend (`http://localhost:5173`) and Express backend (`http://localhost:4000`) will start simultaneously.

---

### 4. How to Navigate the Web Application

| Route / Feature | URL | Description | Default Credentials |
| :--- | :--- | :--- | :--- |
| **🏠 Landing Page** | `http://localhost:5173/` | Hero section, course exploration, and trial features | *Public* |
| **📅 Book Trial Class** | `http://localhost:5173/book` | 3-step live booking with email OTP & real-time slot selection | *Public* |
| **📊 Parent Dashboard** | `http://localhost:5173/dashboard` | Manage booked classes, student info & class links | Parent Login |
| **🔑 Parent Login** | `http://localhost:5173/login` | Secure JWT login (automatically redirects to dashboard) | Parent Email / Password |
| **📝 Parent Register** | `http://localhost:5173/register` | Sign up with email OTP verification | New Parent |
| **🛡️ Admin Portal** | `http://localhost:5173/admin` | Live metrics, daily capacity meter & calendar date slot checker | `admin@codeyoung.example` / `AdminSecurePassword123!` |
| **👨‍🏫 Admin Mentors** | `http://localhost:5173/admin/mentors` | Toggle active mentors & inspect daily 2-class limits | Admin Only |
| **📋 Admin Bookings** | `http://localhost:5173/admin/bookings` | View full schedule, copy class links & cancel classes | Admin Only |
| **🚀 Backend API** | `http://localhost:4000/api` | REST API health check (`/api/health`) | Backend Service |

---

### 5. Running Tests & Production Builds

```bash
# Run all 82 client & server tests
npm test

# Run type-checks and production bundle build (Vite + TypeScript)
npm run build
```

---

## 1. Project Overview

The CodeYoung Trial-Class Booking Platform automates the scheduling and assignment of live 45-minute interactive trial classes (Mathematics, Coding, Science, English) between parents worldwide and mentors in diverse timezones (such as India `Asia/Kolkata`, US `America/New_York`, and UK `Europe/London`).

All slot generation, availability checks, mentor load balancing, and persistence enforce timezone safety, strict daily capacity limits, and ACID transaction guarantees.

---

## 2. Key Features

- **Responsive Landing Page & Navigation**: Modern hero section, course exploration, value propositions, interactive header navigation with dropdown menus, mobile navigation drawer, and footer.
- **Parent Registration & JWT Authentication**: Secure user registration, password hashing via `bcryptjs`, short-lived JWT access tokens, and HTTP-only refresh tokens.
- **Parent Dashboard**: Protected parent portal displaying upcoming confirmed classes, mentor assignments, meeting links, and student profiles.
- **Timezone-Safe Slot Generation**: Dynamic 45-minute trial slot computation from mentor local working hours mapped to parent local viewing times without manual offset math.
- **DST & Wall-Clock Protection**: Spring-forward gap detection and fall-back ambiguity resolution powered by Luxon.
- **Fair Mentor Load Balancing**: Automatic assignment of the least-loaded eligible mentor with slot overlap prevention.
- **Strict Daily Capacity Limit**: Hard cap of maximum 2 classes per mentor evaluated in the mentor's local calendar day (`00:00` to `23:59:59.999` in mentor's IANA timezone).
- **Prisma Interactive Transactions**: Atomic database transactions ensuring zero double-booking even under concurrent slot requests.
- **Unique Class Links**: Generation of reproducible virtual classroom links (`https://meet.codeyoung.example/room/cy-...`).
- **Dual Notification Engine**: Transactional confirmation and cancellation emails sent with respective parent-local and mentor-local formatted timestamps.
- **Protected Admin Dashboard & Routes**:
  - `/admin`: High-level metrics (Total Mentors, Active Mentors, Total Bookings, Confirmed Classes), quick action links, and recent bookings.
  - `/admin/mentors`: Real-time mentor active/inactive status toggle, timezone display, and local daily booking capacity tracker.
  - `/admin/bookings`: Full booking history with parent-local and mentor-local timestamps, status filter (`ALL`, `CONFIRMED`, `CANCELLED`), copyable class links, and admin-triggered cancellation with automated email alerts.
  - **Backend RBAC**: Express middleware strictly enforces `ADMIN` role on all `/api/admin/*` endpoints.

---

## 3. Technology Stack

- **Frontend**:
  - React 18, TypeScript, Vite
  - React Router DOM v7
  - Tailwind CSS
  - Vitest & React Testing Library
- **Backend**:
  - Node.js & Express
  - TypeScript (ES Modules)
  - Luxon (Timezone calculations & IANA handling)
  - Zod (Runtime input validation)
  - JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
  - Helmet, CORS, Cookie-Parser, Express-Rate-Limit
  - Vitest & Supertest
- **Database & ORM**:
  - PostgreSQL
  - Prisma ORM v6
- **Tooling & Monorepo**:
  - npm Workspaces (`client` and `server`)
  - ESLint 9 & Prettier

---

## 4. Folder Structure

```
code_young/
├── client/                     # React + Vite frontend workspace
│   ├── src/
│   │   ├── __tests__/          # Frontend component & page tests
│   │   │   ├── AdminPages.test.tsx
│   │   │   ├── App.test.tsx
│   │   │   ├── AuthPages.test.tsx
│   │   │   └── BookTrialPage.test.tsx
│   │   ├── components/         # Reusable UI components (Navbar, Header, AdminHeader, Footer, etc.)
│   │   ├── context/            # AuthContext & state management
│   │   ├── pages/              # Route pages (HomePage, BookTrialPage, Admin*, DashboardPage, etc.)
│   │   ├── App.tsx             # Route definitions & ProtectedRoute guards
│   │   └── main.tsx            # React root mount
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                     # Express + TypeScript backend workspace
│   ├── src/
│   │   ├── __tests__/          # Backend integration & unit test suites
│   │   │   ├── admin.test.ts
│   │   │   ├── auth.test.ts
│   │   │   ├── availability.test.ts
│   │   │   ├── booking.test.ts
│   │   │   ├── health.test.ts
│   │   │   ├── notification.test.ts
│   │   │   ├── otp.test.ts
│   │   │   ├── parent.test.ts
│   │   │   ├── timezone.test.ts
│   │   │   └── trial.test.ts
│   │   ├── config/             # JWT & environment configurations
│   │   ├── controllers/        # Express route handlers (admin, auth, booking, parent, trial, etc.)
│   │   ├── middleware/         # Auth & RBAC middlewares (authenticate, requireAdmin, requireRole)
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── services/           # Business logic & domain services
│   │   │   ├── email/          # Transactional email service (DevelopmentEmailService)
│   │   │   ├── otp/            # OTP dispatch & verification service
│   │   │   ├── adminService.ts
│   │   │   ├── authService.ts
│   │   │   ├── availabilityService.ts
│   │   │   └── bookingService.ts
│   │   ├── utils/              # Timezone utilities, AppError, Prisma client
│   │   ├── app.ts              # Express application configuration
│   │   └── index.ts            # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── prisma/
│   ├── migrations/             # Database migration SQL files
│   ├── schema.prisma           # Prisma data models & relations
│   └── seed.ts                 # Database seeding script (Admin & Mentors)
├── docs/                       # Architecture & development documentation
├── AGENTS.md                   # Core project rules and architectural invariants
├── PLAN.md                     # Step-by-step implementation milestones
├── package.json                # Root monorepo configuration
└── README.md                   # Main project documentation
```

---

## 5. PostgreSQL Setup & Environment Configuration

### Environment Variables

Copy `.env.example` to create your local `.env` file in the root directory:

```bash
cp .env.example .env
```

Configurable variables:

```env
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/codeyoung_dev?schema=public
VITE_API_BASE_URL=http://localhost:4000/api
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_REFRESH_SECRET=your_refresh_secret_key_change_in_production
ADMIN_EMAIL=admin@codeyoung.example
ADMIN_PASSWORD=AdminSecurePassword123!
ADMIN_NAME=CodeYoung Admin
```

### PostgreSQL Database Setup

1. Ensure PostgreSQL is installed and running on your system.
2. Create the development database:

```sql
CREATE DATABASE codeyoung_dev;
```

---

## 6. Prisma Migration & Seeding Commands

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Apply Migrations

To apply existing migrations to your PostgreSQL database:

```bash
npx prisma migrate deploy
```

For local development migrations:

```bash
npx prisma migrate dev --name init
```

### Seed Database

Populates the default Admin account and 10 mentors with recurring Monday–Friday availability (09:00–17:00 IST):

```bash
npm run prisma:seed
```

---

## 7. Development Startup Commands

### Install All Workspace Dependencies

```bash
npm install
```

### Start Both Frontend and Backend Concurrently

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- API Health Check: `http://localhost:4000/api/health`

### Start Individual Workspaces

- **Frontend Only**:
  ```bash
  npm run dev:client
  ```
- **Backend Only**:
  ```bash
  npm run dev:server
  ```

---

## 8. Test Commands & Quality Assurance

Run the complete test suite (82 tests across 14 test suites covering both workspaces):

```bash
npm test
```

### Individual Test Commands

- **Backend Tests (Unit & Integration)**:
  ```bash
  npm run test:server
  ```
- **Frontend Tests (Vitest & Testing Library)**:
  ```bash
  npm run test:client
  ```
- **TypeScript Typecheck**:
  ```bash
  npm run typecheck
  ```
- **ESLint**:
  ```bash
  npm run lint
  ```
- **Prettier Format Check**:
  ```bash
  npm run format:check
  ```
- **Prettier Write**:
  ```bash
  npm run format
  ```
- **Production Build (Client & Server)**:
  ```bash
  npm run build
  ```

---

## 9. System Architectural Workflows & Invariants

### Authentication Flow

1. User registers via `/api/auth/register` or logs in via `/api/auth/login`.
2. Server validates inputs using Zod, hashes passwords with `bcryptjs`, and issues:
   - A short-lived (15 min) JWT Access Token returned in the JSON payload.
   - A long-lived (7 day) HTTP-only, secure Refresh Token stored as a cookie and hashed in the database.
3. Protected endpoints verify the `Bearer <token>` via `authenticate` middleware.
4. Token refreshes occur via `/api/auth/refresh` without interrupting user sessions.

### Phone OTP Development Behavior

- In development/test mode, OTP generation logs the 6-digit code to the backend console (`[DEV OTP SERVICE] Generated OTP for <phone>: 123456`).
- The OTP hash is stored in memory or in the database with a 10-minute expiry time.
- Implements a 60-second resend cooldown and locks after 5 consecutive failed attempts.
- In production, the `TwilioOtpService` or SMS gateway handles actual cellular dispatch.

### Booking Flow

1. **Parent Submission**: Parent completes the trial request form with student details, subject interest, and IANA timezone.
2. **OTP Verification**: Parent verifies their mobile number.
3. **Slot Fetching**: Client requests `/api/availability?date=YYYY-MM-DD&timezone=IANA_TZ`.
4. **Slot Selection & Booking**: Parent selects a slot and submits `/api/bookings` with `trialRequestId` and `startUtc`.
5. **Confirmation**: System executes transaction, pairs mentor, generates class link, formats local timestamps, dispatches notifications, and renders confirmation screen.

### Mentor Assignment Logic

1. System queries active mentors having availability matching the requested day-of-week and time range.
2. Filters out mentors with an existing booking overlapping the `[startUtc, startUtc + 45min]` interval.
3. Filters out mentors who have already reached their daily booking limit for that calendar day in their local timezone.
4. Selects the eligible mentor with the **lowest number of confirmed bookings on that date** (least-loaded).

### Maximum Two Classes Per Mentor Per Local Day

- Daily capacity is evaluated strictly from the mentor's perspective (`00:00:00` to `23:59:59.999` in the mentor's local timezone).
- For a mentor in `Asia/Kolkata`, a class at `2026-10-12 01:00 UTC` (which is `06:30 IST` on Oct 12) counts towards Oct 12.
- Hard limit of 2 bookings/day prevents mentor fatigue and guarantees teaching quality.

### UTC and Timezone Strategy

- **Persistence**: All appointment timestamps (`startUtc`, `endUtc`) are stored in UTC ISO format in PostgreSQL.
- **Separate Timezones**: Parent timezone (e.g., `America/New_York`) and mentor timezone snapshot (e.g., `Asia/Kolkata`) are stored separately on each booking record.
- **No Offset Math**: All conversions use Luxon's `DateTime.setZone(ianaZone)`. Fixed offset strings (like `UTC+5`) are strictly rejected.

### Daylight Saving Time (DST) Handling

- **Spring-Forward**: Luxon detects invalid wall-clock gaps (e.g., `02:30` on US Spring Forward date) and shifts the slot forward to valid wall-clock time (`03:30 EDT`).
- **Fall-Back**: Detects ambiguous repeated wall-clock hours and deterministically selects the standard first instance.

### Dummy Class-Link Behavior

- Virtual classroom links are deterministically generated per booking using the format `https://meet.codeyoung.example/room/cy-<random-hash>`.
- The identical class link is embedded in parent confirmation emails, mentor notification emails, parent dashboard, and admin management tables.

### Email Notification Behavior

- Uses `DevelopmentEmailService` in local and test environments to log transactional email payloads to memory and server output.
- Dispatches dual notifications on booking creation:
  - **Parent Email**: Formatted with parent-local time (e.g., `2026-10-12 01:00 EDT (-04:00)`).
  - **Mentor Email**: Formatted with mentor-local time (e.g., `2026-10-12 10:30 IST (+05:30)`).
- On admin cancellation, cancellation notices with reason and local timestamps are immediately sent to both parties.
- Email failures do not roll back successful database bookings (fail-safe notification execution).


### Future Improvements
.
- Live WebRTC / Zoom API classroom integration to replace simulated dummy meeting rooms.

