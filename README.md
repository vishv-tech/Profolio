# The Architects — GNKC Hackathon 2026

This repository is the shared foundation for an application that turns an
uploaded resume into an editable, publishable professional portfolio.

## Current phase

Tasks 3 and 4 are finalized against the configured live Supabase project, and
Sprint 1 now provides the first complete user workflow:

- both database migrations are applied remotely
- `src/types/database.ts` is genuine output generated from the live schema
- email/password signup, confirmation, login, and logout
- verified server-side identity checks with `auth.getClaims()`
- database-backed role and account-status guards
- user/Admin role routing and protected route layouts
- an append-only migration that blocks suspended accounts through RLS and
  Storage policies
- private PDF resume upload with client and server validation
- owner-scoped `resumes` rows with retry-safe processing statuses
- server-only Gemini structured extraction and optional factual copy improvement
- normalization into the frozen `PortfolioData` contract with application IDs
- a complete editable review with add, delete, and reorder controls
- reviewed-data save followed by the existing `/themes` Sprint 2 handoff

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
PROFOLIO_DEMO_MODE=false
```

`SUPABASE_SECRET_KEY` is server-only. It must never be exposed to a Client
Component, response, log, browser store, or committed environment file. Normal
authentication uses the request-scoped publishable-key client and the signed-in
user's cookies, not the privileged client.

`GEMINI_API_KEY` is also server-only and is required for resume extraction.
Create a key in Google AI Studio, place it only in `.env.local`, and restart the
development server. The application never sends the key, a raw Gemini error, or
a private resume URL to the browser.

`PROFOLIO_DEMO_MODE` is an optional server-only reliability flag and defaults to
`false`. Set it to `true` in `.env.local` only when demonstrating the recognized
Vishv resume flow, then restart the development server. It is intentionally not
prefixed with `NEXT_PUBLIC_`; unrelated resumes and normal production behavior
continue through the real Gemini extraction path.

## Resume workflow

An active user can follow the dashboard link to `/upload`, choose one PDF up to
10 MB, and optionally enable **Improve wording with AI**. The server validates
the PDF signature, stores it at `<authenticated-user-id>/<uuid>.pdf` in the
existing private `resumes` bucket, and inserts an owner-scoped row. It then
downloads that object through the signed-in request client and submits the
bytes directly to Gemini; no public or signed browser URL is created.

The row lifecycle is:

```text
uploaded -> processing -> completed
                       -> failed -> processing (manual retry)
```

The extraction schema deliberately has no application IDs. The server adds
IDs with `crypto.randomUUID()`, validates the normalized result with
`PortfolioDataSchema`, and only then writes `resumes.extracted_data`. Improve
mode may polish supported prose but its prompt forbids invented facts,
credentials, organizations, technologies, dates, metrics, or achievements.
Users must review the result before saving and continuing to `/themes`.

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

The built-in Free-plan email provider has a low project-wide delivery limit,
so the application treats confirmation-required signup as success, classifies
HTTP 429 separately, and offers a client-cooled-down resend action. A custom
SMTP provider is optional for production delivery volume and must be configured
in the Supabase Dashboard; no SMTP credentials belong in this repository.

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
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Interactive login and account-specific authorization checks require dedicated
test-account credentials. Real PDF extraction additionally requires a non-empty
`GEMINI_API_KEY`. A local build alone does not prove those live Auth, RLS,
Storage, or Gemini behaviors.
