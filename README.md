# Barangay Digital Service Platform

MVP demo application for Philippine barangay service operations. The app includes tenant-scoped staff authentication, resident and household records, certificate workflows, public online document requests, announcements, audit logs, reports, exports, and QR certificate verification.

## Demo Scope

- Auth.js credentials login with role-based access
- Barangay tenant context for staff workspaces
- Resident Registry and Household Registry
- Certificate creation, approval, release, preview, PDF export, and DOCX export
- QR-backed certificate verification page
- Public portal for online document requests and request tracking
- Dashboard analytics and printable basic reports
- Barangay settings, user management, announcements, and audit trail
- Seeded Barangay San Isidro demo data

Billing, subscriptions, platform administration, backup/restore, SMS, GIS, health, disaster, and other future modules are intentionally outside this MVP demo.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from the example:

   ```bash
   cp .env.example .env
   ```

3. Configure local environment values:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barangay_saas_dev"
   AUTH_SECRET="replace-with-a-local-secret"
   NEXTAUTH_SECRET="replace-with-a-local-secret"
   NEXTAUTH_URL="http://localhost:3000"
   APP_URL="http://localhost:3000"
   ```

4. Push the Prisma schema to the local database:

   ```bash
   npx prisma db push
   ```

5. Generate Prisma Client:

   ```bash
   npx prisma generate
   ```

6. Seed demo data:

   ```bash
   npx prisma db seed
   ```

7. Start the dev server:

   ```bash
   npm run dev
   ```

8. Open the staff app:

   ```text
   http://localhost:3000/login
   ```

## Demo Login Accounts

All seeded accounts use:

```text
password123
```

- Super admin: `superadmin@barangay-platform.local`
- Barangay admin: `admin@sanisidro.local`
- Secretary: `secretary@sanisidro.local`
- Barangay captain: `captain@sanisidro.local`
- Staff: `staff@sanisidro.local`

Recommended guided demo login:

```text
admin@sanisidro.local
password123
```

## Public Portal

Barangay San Isidro public portal:

```text
http://localhost:3000/b/san-isidro
```

Submit an online request:

```text
http://localhost:3000/b/san-isidro/request
```

Track an online request:

```text
http://localhost:3000/b/san-isidro/track
```

Use the seeded tracking codes from the Public Requests page, or submit a new request and keep the generated request number plus contact number.

## QR Certificate Verification

Approved or released certificates can be exported and include a QR code. The QR code points to:

```text
/verify/{certificateId}
```

During a demo, open an approved or released certificate from the Certificate Logbook, use the preview/export controls, then scan or open the verification URL to show the public authenticity check.

## Demo QA

Run the main verification commands:

```bash
npm run prisma:validate
npm run prisma:generate
npm run typecheck
npm run build
```

Optional route smoke check after starting the app:

```bash
npm run dev
npm run smoke:routes
```

The smoke script signs in as the seeded barangay admin, checks the main demo routes, verifies that SECRETARY and STAFF cannot manage users, and confirms that SUPER_ADMIN without barangay context sees the expected placeholder.

## Deployment Readiness

This project is prepared for later cloud deployment without subscriptions, billing, platform admin, or extra business modules.

### Local Development Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `APP_URL`.
4. Run committed Prisma migrations with `npm run db:deploy`. Use `npm run db:push` only as a disposable local-development convenience.
5. Run `npm run prisma:generate`.
6. Seed demo data with `npm run db:seed`.
7. Start the app with `npm run dev`.

### Required Environment Variables

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
AUTH_SECRET="use-a-strong-random-secret-at-least-32-characters"
NEXTAUTH_SECRET="use-the-same-strong-secret-or-a-compatible-auth-secret"
NEXTAUTH_URL="https://your-app.example.com"
APP_URL="https://your-app.example.com"
```

Use production URLs for `NEXTAUTH_URL` and `APP_URL` in cloud environments. Do not commit real secrets.

### Vercel Deployment Notes

- Create a Vercel project from the repository.
- Add all required environment variables in the Vercel project settings.
- Use the production app origin for `NEXTAUTH_URL` and `APP_URL`.
- Keep Auth.js `trustHost` enabled for cloud-hosted requests.
- Run Prisma deployment steps against the production database before opening the app to users.
- Use `/api/health` for a lightweight health check. It returns app status, timestamp, and whether the database is reachable.

### Neon or Supabase PostgreSQL Notes

- Use the provider's pooled or direct PostgreSQL connection string as `DATABASE_URL`.
- Confirm SSL requirements from the database provider and include any required connection string parameters.
- Keep separate databases or schemas for local development, demos, staging, and production.
- Do not seed demo accounts into a real production barangay workspace.

### Prisma Migration Workflow

- All schema changes must be created locally with `npm run prisma:migrate -- --name <migration-name>` and the generated migration files must be committed.
- Apply committed migrations to shared and production databases with `npm run db:deploy`.
- `npm run db:push` is a disposable local-development convenience only. Never use it against a shared or production database.
- Always run `npm run prisma:validate` and `npm run prisma:generate` after schema changes.
- Confirm the target `DATABASE_URL` before running `db:push`, migrations, or seed commands.
- Any production database, including Vercel-connected, Neon, or Supabase databases, must be baselined and verified independently before its first deployment. This migration investigation covered only the local development database.

### Seed Demo Data

Seed data is for local demos and demo cloud environments only:

```bash
npm run db:seed
```

The seed creates Barangay San Isidro demo records and login accounts. Do not run it in a real production tenant unless you intentionally want demo data.

### Deployment Checklist

- Set `DATABASE_URL`.
- Set `AUTH_SECRET` and `NEXTAUTH_SECRET`.
- Set `NEXTAUTH_URL`.
- Set `APP_URL`.
- Run `npm run db:deploy` against the target database.
- Run `npm run db:seed` only for demo environments.
- Verify staff login at `/login`.
- Verify the public portal at `/b/san-isidro` or the deployed barangay slug.
- Verify QR certificate verification at `/verify/{certificateId}`.
- Verify `/api/health` does not expose secrets and reports database reachability.
