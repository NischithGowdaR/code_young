# Development Guide

This guide outlines steps for setting up, running, checking, and building the project locally without Docker or an active database connection.

---

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (v9 or higher)

---

## 1. Installation

Install all workspace dependencies from the root directory:

```bash
npm install
```

---

## 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Note: No live PostgreSQL database server or Docker container is required for this setup stage.

---

## 3. Running Applications

### Frontend Development Server

Start the React Vite development server (runs on `http://localhost:5173`):

```bash
npm run dev:client
```

### Backend Development Server

Start the Express API server (runs on `http://localhost:4000`):

```bash
npm run dev:server
```

### Concurrent Development

Run both frontend and backend concurrently:

```bash
npm run dev
```

---

## 4. Code Quality & Testing Checks

### Type Checking

Run TypeScript type checks across all workspaces:

```bash
npm run typecheck
```

### Linting

Run ESLint checks:

```bash
npm run lint
```

### Formatting Verification

Run Prettier check:

```bash
npm run format:check
```

### Running Tests

Execute Vitest test suites for frontend and backend:

```bash
# Run all tests
npm test

# Run frontend tests only
npm run test:client

# Run backend tests only
npm run test:server
```

---

## 5. Production Build

Build both frontend and backend for production:

```bash
npm run build
```
