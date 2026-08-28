# The Architects — GNKC Hackathon 2026

This repository is the shared foundation for an application that turns an
uploaded resume into an editable, publishable professional portfolio.

## Current phase

Tasks 3 and 4 are finalized against the configured live Supabase project:

- both database migrations are applied remotely
- `src/types/database.ts` is genuine output generated from the live schema
- email/password signup, confirmation, login, and logout
- verified server-side identity checks with `auth.getClaims()`
- database-backed role and account-status guards
- user/Admin role routing and protected route layouts
- an append-only migration that blocks suspended accounts through RLS and
  Storage policies

The generated database file describes PostgreSQL and remains separate from the
application-level `PortfolioData` and `ThemeConfig` contracts. Do not hand-edit
or replace it with handwritten interfaces.

## Stack

- Next.js App Router with React and strict TypeScript
- Tailwind CSS and shadcn/ui
- Supabase Auth, PostgreSQL, Storage, JavaScript, and SSR clients
- Zod validation
- npm

## Local development

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and add values from the verified
   `Profolio` project.
3. Run `npm run dev` and open <http://localhost:3000>.

Required environment variable names:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
GEMINI_API_KEY=
```

`SUPABASE_SECRET_KEY` is server-only. It must never be exposed to a Client
Component, response, log, browser store, or committed environment file. Normal
authentication uses the request-scoped publishable-key client and the signed-in
user's cookies, not the privileged client.

## Authentication architecture

- `src/lib/auth/guards.ts` contains the single server-only authorization layer:
  `requireUser()`, `requireActiveUser()`, and `requireAdmin()`.
- `src/lib/auth/actions.ts` contains signup, login, and logout Server Actions.
- `src/lib/auth/redirects.ts` centralizes user/Admin/suspended destinations and
  validates any internal `next` path.
- `proxy.ts` refreshes Supabase session cookies. It is not the authorization
  authority; protected layouts/pages call guards on the server.
- Signup sends only `full_name` and `username` as profile metadata. The database
  trigger assigns `role = user` and `account_status = active`.

Role destinations are fixed:

```text
active user  -> /dashboard
active admin -> /admin
suspended    -> /account-suspended
```

## Database foundation and generated types

These migrations are already applied to the live `Profolio` project:

```text
supabase/migrations/20260827000000_initial_profolio_schema.sql
supabase/migrations/20260828025218_auth_active_account_security.sql
```

`src/types/database.ts` was generated from that live project and is used by the
browser, request-scoped server, proxy, and privileged server-only clients. Only
regenerate it from the verified linked project after an intentional schema
change:

```bash
npx supabase gen types typescript --linked --schema public > src/types/database.ts
```

Do not reset, recreate, or reseed the linked live database. If a table is not
available through the Data API, verify the project's exposed-schema and table
grant settings separately from RLS.

## Supabase Auth dashboard setup

In Auth URL Configuration:

- local Site URL: `http://localhost:3000`
- local allowed redirect: `http://localhost:3000/auth/confirm`
- production Site URL: the exact production origin after deployment
- production allowed redirect: the exact production `/auth/confirm` URL

Avoid unrestricted production wildcards. On new Supabase Free projects, leave
the default **Confirm signup** email template unchanged. Signup intentionally
sets its trusted `emailRedirectTo` to `/auth/confirm`; Supabase's default link
then returns a PKCE `code`, which the Route Handler exchanges for the session.
No custom SMTP provider or email-template modification is required for local
confirmation testing.

The Route Handler also retains `token_hash` verification for existing projects
that already use a compatible custom confirmation template.

## First Admin

Signup never creates an Admin. The first Admin was created through normal Auth
and then deliberately promoted through trusted database administration after
its user ID was verified. Future promotions follow the same pattern:

```sql
update public.profiles
set role = 'admin'
where id = '<verified-auth-user-id>';
```

A suspended Admin still fails `requireAdmin()`.

## Verification

Local checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Interactive login and account-specific authorization checks require dedicated
test-account credentials. A local build alone does not prove those live Auth,
RLS, or Storage behaviors.
