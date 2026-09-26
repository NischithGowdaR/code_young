# AGENTS.md

## Project Rules & Guidelines

- **Frontend Architecture**: Use React and TypeScript for the frontend.
- **Backend Architecture**: Use Node.js, Express, and TypeScript for the backend.
- **Database & ORM**: Use PostgreSQL with Prisma.
- **Timezone Calculations**: Use Luxon for all timezone and daylight-saving calculations.
- **Timezone Identifiers**: Use IANA timezone names such as `Asia/Kolkata`, `America/New_York`, and `Europe/London`.
- **Timestamp Storage**: Store appointment timestamps in UTC.
- **Timezone Separation**: Store parent and mentor timezones separately.
- **Validation**: Use Zod for API and form validation.
- **Database Transactions**: Use Prisma transactions for final booking creation.
- **Backend Authorization**: Enforce all authorization rules on the backend.
- **Security & Passwords**: Never store passwords as plain text.
- **Secrets Management**: Never commit secrets or API keys.
- **Component Design**: Keep components reusable.
- **Testing**: Add tests for important business rules.
- **Scope Control**: Do not build unnecessary features.
