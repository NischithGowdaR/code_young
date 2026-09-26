# Architecture Overview

This document describes the high-level architecture of the CodeYoung Trial Class Booking System.

---

## Workspace Structure

The project is structured as a monorepo containing distinct packages for frontend and backend:

```
code_young/
├── client/          # React + Vite + TypeScript frontend
├── server/          # Node.js + Express + TypeScript backend
├── prisma/          # Prisma ORM schema and configuration
├── docs/            # Architecture and development documentation
└── tests/           # Integration and cross-layer tests
```

---

## 1. Frontend (`client/`)

- **Framework**: React with Vite for fast HMR and optimized builds.
- **Routing**: React Router for single-page application navigation.
- **Styling**: Tailwind CSS for utility-first styling.
- **Testing**: Vitest + React Testing Library for unit and component testing.

---

## 2. Backend (`server/`)

- **Runtime & Framework**: Node.js with Express and TypeScript.
- **Validation**: Zod schemas for request validation.
- **Timezone Calculations**: Luxon for Daylight Saving Time (DST) safe operations with explicit IANA timezone identifiers.
- **Testing**: Vitest + Supertest for HTTP endpoint integration tests.

---

## 3. Database Layer (`prisma/`)

- **ORM**: Prisma Client for type-safe database queries.
- **Database Provider**: PostgreSQL (to be configured in a later stage).
- **Timezone & Transactions**: Appointment timestamps will be stored in UTC, and Prisma transactions will enforce atomic booking creation.
