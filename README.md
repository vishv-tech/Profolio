# The Architects — GNKC Hackathon 2026

This repository is the shared foundation for an application that turns an
uploaded resume into an editable, publishable professional portfolio.

## Current phase

Task 4's local authentication and authorization foundation is implemented:

- email/password signup, confirmation, login, and logout
- verified server-side identity checks with `auth.getClaims()`
- database-backed role and account-status guards
- user/Admin role routing and protected route layouts
- an append-only migration that blocks suspended accounts through RLS and
  Storage policies

The live Supabase integration is intentionally **not marked complete**. The
Task 3 migration has not been verified on the remote `Profolio` project,
`src/types/database.ts` has not been generated from that project, and the
required local Supabase environment values are not configured. Generated
database types must never be replaced with handwritten lookalikes.

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
3. Apply the migrations and generate genuine database types as described
   below.
4. Run `npm run dev` and open <http://localhost:3000>.

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

## Apply migrations and generate types

Only link after confirming the target reference belongs to the existing
`Profolio` project:

```bash
npx supabase login
npx supabase link --project-ref <verified-profolio-project-ref>
npx supabase projects list
npx supabase migration list
npx supabase db push
npx supabase db lint --linked
npx supabase test db --linked supabase/tests/auth_active_account_security_test.sql
npx supabase gen types typescript --linked --schema public > src/types/database.ts
```

Also confirm that the project exposes the `public` schema through the Data API;
newer Supabase projects no longer expose newly created tables automatically.

The migrations are:

```text
supabase/migrations/20260827000000_initial_profolio_schema.sql
supabase/migrations/20260828025218_auth_active_account_security.sql
```

After type generation, add the genuine `Database` generic to the browser,
server, and privileged Supabase clients. Do not hand-edit the generated file.

## Supabase Auth dashboard setup

In Auth URL Configuration:

- local Site URL: `http://localhost:3000`
- local allowed redirect: `http://localhost:3000/auth/confirm`
- production Site URL: the exact production origin after deployment
- production allowed redirect: the exact production `/auth/confirm` URL

Avoid unrestricted production wildcards. Configure the **Confirm signup** email
template to send the token hash to the server Route Handler, for example:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard">
  Confirm email address
</a>
```

New Free-plan projects that cannot customize Auth templates with the default
mailer need a custom SMTP provider before using this template. Production
projects should use production-grade SMTP in any case.

## First Admin

Signup never creates an Admin. Create a normal Auth account, then deliberately
promote that exact profile through a trusted SQL/Admin operation after checking
its user ID:

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

Live signup/login/session and RLS/Storage tests require the verified remote
project, applied migrations, Auth dashboard configuration, and dedicated test
accounts. Do not report those tests as passing from a local build alone.
