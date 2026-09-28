# CodeYoung Trial-Class Booking Platform & AI Chatbot

A full-stack trial-class booking platform and intelligent conversational assistant built with **React**, **TypeScript**, **Node.js**, **Express**, **PostgreSQL**, and **Prisma**. Engineered to handle multi-timezone scheduling, daylight-saving time transitions, concurrent booking transactions, and conversational booking with **Groq AI**.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client (React + Vite + TypeScript)"]
        UI["Landing & Course Pages"]
        AuthUI["Login / Register / Forgot Password"]
        DashUI["Parent & Admin Portals"]
        ChatWidget["AI Chatbot Widget (ChatWindow, ChatInput, QuickActions)"]
        AuthCtx["AuthContext (JWT & Session Management)"]
    end

    subgraph Backend ["Backend API (Node.js + Express + TypeScript)"]
        Router["Express Router & Rate Limiting"]
        AuthMw["Auth & RBAC Middleware"]
        ZodVal["Zod Validation Layer"]
        
        subgraph ChatModule ["Chat Module (server/src/modules/chat/)"]
            ChatCtrl["Chat Controller (/api/chat)"]
            ChatSvc["Chat Service (OpenAI SDK / Groq Client)"]
            ToolDisp["Tool Dispatcher (11 Registered Tools)"]
            Prompts["System Prompts & Strict Guardrails"]
        end

        subgraph CoreServices ["Core Domain Services"]
            AuthSvc["AuthService (bcrypt + JWT tokens)"]
            AvailSvc["AvailabilityService (Luxon Timezone Engine)"]
            BookSvc["BookingService (Prisma Transactions)"]
            AdminSvc["AdminService (Mentor & Schedule Mgmt)"]
            OtpSvc["OtpService (6-Digit Code Factory)"]
            EmailSvc["EmailService (Brevo API & Dev Dispatch)"]
        end
    end

    subgraph AIInference ["AI Cloud Inference"]
        GroqAPI["Groq Cloud API (openai/gpt-oss-120b)"]
    end

    subgraph Persistence ["Persistence & External Services"]
        DB[("PostgreSQL Database (Prisma ORM)")]
        BrevoRelay["Brevo SMTP / API Email Relay"]
    end

    %% Client to Backend
    UI --> Router
    AuthUI --> Router
    DashUI --> Router
    ChatWidget --> Router
    AuthCtx -.->|Bearer JWT| AuthMw

    %% Backend Routing
    Router --> ZodVal
    ZodVal --> AuthMw
    AuthMw --> ChatCtrl
    AuthMw --> CoreServices

    %% Chat & AI Flow
    ChatCtrl --> ChatSvc
    ChatSvc <-->|Tool Calling / Prompts| GroqAPI
    ChatSvc --> ToolDisp
    ToolDisp --> AuthSvc
    ToolDisp --> AvailSvc
    ToolDisp --> BookSvc
    ToolDisp --> OtpSvc

    %% Service Operations
    AuthSvc --> DB
    AvailSvc --> DB
    BookSvc --> DB
    AdminSvc --> DB
    OtpSvc --> DB
    OtpSvc --> EmailSvc
    BookSvc --> EmailSvc
    EmailSvc --> BrevoRelay
```

---

## ⚡ Quick Start: How to Navigate & Run the Project

### 1. Prerequisites
- **Node.js**: `v18.x`, `v20.x`, or `v22.x`
- **npm**: `v9.x` or higher
- **PostgreSQL**: Running locally, via Docker, or cloud-hosted

---

### 2. Project Structure
The repository is structured as an **npm monorepo**:
```bash
# Monorepo Root
d:\code_young\

# Frontend Workspace (React + Vite + Tailwind CSS)
client/

# Backend Workspace (Node.js + Express + Prisma)
server/
```

---

### 3. Step-by-Step Setup & Run Commands

From the root `code_young` directory:

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Configure Environment Variables
Copy `.env.example` to create your local `.env` and `server/.env`:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env
Copy-Item .env.example server/.env

# On Linux/macOS/Git Bash:
cp .env.example .env
cp .env.example server/.env
```
*(Fill in your PostgreSQL `DATABASE_URL` and `GROQ_API_KEY` in `.env`)*

#### Step 3: Initialize Database & Seed Mentors
```bash
# Generate Prisma Client
npm run prisma:generate

# Run Database Migrations
npx prisma migrate deploy

# Seed Default Admin & 10 Mentors with Availability
npm run prisma:seed
```

#### Step 4: Run the Application (Concurrent Dev Servers)
```bash
npm run dev
```
> Starts both the React frontend (`http://localhost:5173`) and Express backend (`http://localhost:4000`) simultaneously.

---

### 4. Web Application Navigation & Routes

| Route / Feature | URL | Description | Access |
| :--- | :--- | :--- | :--- |
| **🏠 Landing Page** | `http://localhost:5173/` | Hero section, course exploration, and trial features | *Public* |
| **🤖 AI Chatbot** | Floating bubble on all pages | Interactive assistant for booking, login, OTP, navigation | *Public / Authenticated* |
| **📅 Book Trial Class** | `http://localhost:5173/book` | 3-step live booking with email OTP & real-time slot selection | *Public / Authenticated* |
| **📊 Parent Dashboard** | `http://localhost:5173/dashboard` | Manage booked classes, student info & virtual class links | *Parent Only* |
| **🔑 Parent Login** | `http://localhost:5173/login` | Secure JWT login (auto-redirects to dashboard) | *Public* |
| **📝 Parent Register** | `http://localhost:5173/register` | Sign up with email OTP verification | *Public* |
| **🛡️ Admin Portal** | `http://localhost:5173/admin` | Live metrics, daily capacity meter & bookings review | *Admin Only* |
| **👨‍🏫 Admin Mentors** | `http://localhost:5173/admin/mentors` | Toggle active mentors & inspect daily 2-class limits | *Admin Only* |
| **📋 Admin Bookings** | `http://localhost:5173/admin/bookings` | View full schedule, copy class links & cancel classes | *Admin Only* |
| **🚀 Backend API** | `http://localhost:4000/api` | REST API health check (`/api/health`) | *Service* |

---

## 🤖 AI Chatbot System

The platform features an embedded **Groq AI Conversational Assistant** available across all pages.

### Core Capabilities:
1. **Conversational Booking Flow with 6-Digit Email OTP**:
   - The user selects a course (Math, Coding, English, Science), student grade, date, and timezone.
   - The assistant queries real available slots (`get_available_slots`) without fabricating data.
   - When the user confirms the slot, the assistant triggers `send_booking_otp` to email a 6-digit code.
   - Upon receiving the code in chat, the assistant validates it via `confirm_booking` and executes an atomic Prisma transaction to lock in the mentor and booking.
2. **In-Chat Direct Authentication (Login & Logout)**:
   - Users can type their email and password directly into the chat. The assistant calls `login_user`, verifies credentials via `bcryptjs`, issues JWT tokens, updates the frontend session, and redirects to the dashboard.
   - Saying *"log out"* or *"sign out"* triggers `logout_user`, terminating the session and returning to `/login`.
3. **Dynamic Natural Language Site Navigation**:
   - Users can say *"navigate to home"*, *"go to blog"*, *"show courses"*, *"contact page"*, etc.
   - The assistant invokes `navigate_to_page` to trigger client-side route transitions and smooth section scrolling (e.g. `/#courses`).

### Registered Chat Tools:
| Tool Name | Purpose |
| :--- | :--- |
| `get_course_information` | Returns detailed curriculum, age ranges, and highlights for courses |
| `get_trial_class_information` | Explains trial class duration (45 min), mentor matching, and class links |
| `get_authentication_status` | Checks if current session has valid JWT authentication |
| `login_user` | Authenticates parent via email/password and sets JWT session |
| `logout_user` | Logs out current parent, clears tokens, and navigates to login |
| `get_available_slots` | Queries backend for real mentor availability in parent local time |
| `send_booking_otp` | Dispatches a 6-digit verification code to the parent's email |
| `confirm_booking` | Verifies OTP code and finalizes trial booking inside a Prisma transaction |
| `navigate_to_page` | Dispatches navigation actions to any site route or anchor |
| `redirect_to_login` | Navigates unauthenticated users to the login screen |
| `redirect_to_booking_page` | Directs users to the manual booking form |

---

## 5. Technology Stack

- **Frontend**:
  - React 18, TypeScript, Vite
  - React Router DOM v7
  - Tailwind CSS & Lucide Icons
  - Vitest & React Testing Library
- **Backend**:
  - Node.js & Express
  - TypeScript (ES Modules)
  - OpenAI SDK (configured with Groq Cloud endpoint)
  - Luxon (Timezone calculations & IANA handling)
  - Zod (Runtime input validation)
  - JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
  - Helmet, CORS, Cookie-Parser, Express-Rate-Limit
  - Vitest & Supertest
- **Database & ORM**:
  - PostgreSQL
  - Prisma ORM v6
- **Email & Notification**:
  - Brevo API / SMTP Relay
  - Development In-Memory OTP Dispatcher

---

## 6. Environment Configuration

### Root `.env` & `server/.env` Schema

```env
# Application Environment
NODE_ENV=development
PORT=4000
CLIENT_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:4000/api

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/codeyoung_dev?schema=public

# Admin Initialization (Set your own secure credentials in .env)
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_secure_password
ADMIN_NAME=Admin

# Email / Brevo API / SMTP
BREVO_API_KEY=xkeysib-...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM="CodeYoung <your-email@gmail.com>"

# Groq AI Chat Configuration
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
AI_CHAT_ENABLED=true
```

---

## 7. Testing & Quality Assurance

Run the comprehensive test suite across backend and frontend workspaces:

```bash
# Run all server and client test suites
npm test

# Run backend unit and integration tests (98 tests)
npm run test:server

# Run frontend React component & widget tests (26 tests)
npm run test:client

# Type-check TypeScript codebase
npm run typecheck

# Code formatting & linting
npm run lint
npm run format
```

---

## 8. Architectural Invariants & Business Rules

1. **UTC Timestamp Storage**: All appointment times (`startUtc`, `endUtc`) are strictly stored in UTC ISO format in PostgreSQL.
2. **Timezone Separation**: Parent timezone (e.g. `America/New_York`) and mentor timezone snapshot (e.g. `Asia/Kolkata`) are stored independently on each record.
3. **No Manual Offset Math**: All timezone conversions use Luxon's `DateTime.setZone(ianaZone)`. Fixed offset strings (e.g., `UTC+5`) are rejected.
4. **Daylight Saving Time (DST) Safety**: Spring-forward gaps are advanced to valid wall-clock time; fall-back ambiguities deterministically resolve to the initial standard instance.
5. **Strict Mentor Capacity Cap**: Hard maximum of **2 classes per mentor per local calendar day** (`00:00:00` to `23:59:59.999` in mentor's IANA timezone).
6. **Least-Loaded Mentor Assignment**: Automated selection of the eligible active mentor with the lowest scheduled load on the requested date.
7. **ACID Transactions**: Prisma interactive transactions guarantee zero double-booking even under high concurrent slot selection.
8. **Virtual Classroom Links**: Deterministic generation of virtual room links (`https://meet.codeyoung.example/room/cy-...`) shared across parent and mentor email notifications.
