# Barangay Digital Service Platform

Production-oriented foundation for a multi-tenant SaaS platform that helps Philippine barangays manage residents and digital citizen service requests.

## Foundation Scope

- Next.js App Router with TypeScript and Tailwind CSS
- Prisma/PostgreSQL schema for core MVP entities
- Auth.js-ready credentials authentication foundation
- Tenant and role helpers for barangay-scoped access
- Seed data for subscription plans, a sample barangay, settings, and default users
- Dashboard shell with sidebar, header, and daily-work action cards

Business modules, CRUD screens, certificate generation, reports, payments, SMS, AI, GIS, disaster, health, inventory, blotter, and mobile app features are intentionally not implemented yet.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Update `DATABASE_URL` and `NEXTAUTH_SECRET`.

4. Create the database schema and seed records:

   ```bash
   npm run prisma:migrate
   npm run db:seed
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

## Seed Users

- Super admin: `superadmin@barangay-platform.local`
- Barangay admin: `admin@sample-barangay.local`
- Default password: `ChangeMe123!`

Change seed credentials before using any non-local environment.
