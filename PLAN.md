# Implementation Plan - CodeYoung Trial-Class Booking System

This document outlines the step-by-step development stages for the CodeYoung trial-class booking platform.

---

## Stages

### 1. Project Setup

- Initialize repository structure for frontend (React + TypeScript) and backend (Node.js + Express + TypeScript).
- Configure TypeScript, ESLint, Prettier, and environment variables.
- Set up PostgreSQL database and initialize Prisma ORM schema.

### 2. Landing Page

- Build responsive, modern landing page detailing trial classes.
- Design hero section, feature highlights, course offerings, and trial booking CTA.

### 3. Authentication

- Implement user authentication for Parents, Mentors, and Admins.
- Secure password hashing (e.g., bcrypt/argon2) and JWT/session handling.
- Backend role-based access control (RBAC) enforcement.

### 4. Parent Profile and Trial Form

- Form for parent contact info, student age/grade, subject interest, and preferred learning schedule.
- Zod schemas for input validation on both client and server.

### 5. Phone OTP Verification

- Integrate OTP generation & verification workflow for phone number confirmation during registration.

### 6. Parent Dashboard

- Dashboard for parents to view upcoming trial classes, booking history, student profiles, and mentor details.

### 7. Mentor Availability

- Mentor dashboard to define recurring availability and blackout dates.
- Store availability with explicit IANA timezones (e.g., `Asia/Kolkata`, `America/New_York`).

### 8. Timezone-Safe Slot Generation

- Slot calculation logic using Luxon handling DST transitions accurately.
- Convert slot ranges to UTC timestamps for persistence while mapping to parent/mentor local timezones for UI display.

### 9. Mentor Assignment

- Matching algorithm / logic to pair parent trial requests with eligible available mentors.
- Prisma transaction to lock slot and finalize mentor assignment safely without race conditions.

### 10. Booking Confirmation

- Finalize booking inside a Prisma transaction.
- Create booking record, generate calendar invite payload, and return confirmation details.

### 11. Email Notifications

- Send transactional email confirmations and reminders to parents and mentors with local time details.

### 12. Admin Dashboard

- Management interface for Admins to view all bookings, manual mentor reassignments, user roles, and system metrics.

### 13. Testing

- Unit and integration tests for timezone conversions, availability calculation, slot generation, and booking transactions.
- Security and authorization test coverage.

### 14. Documentation

- API specification, setup instructions, database schema documentation, and deployment guides.
