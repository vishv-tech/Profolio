# The Architects — GNKC Hackathon 2026

This repository is the shared foundation for an application that will turn an
uploaded resume into an editable, publishable professional portfolio.

## Current phase

**Supabase Backend Foundation** — routing and UI scaffolding plus shared data
contracts, validation, Supabase SSR clients, and a reviewed database migration.
Authentication UI, resume parsing, AI, publishing workflows, themes, admin
tools, and analytics UI remain reserved for later phases.

## Stack

- Next.js App Router with React and strict TypeScript
- Tailwind CSS
- shadcn/ui with Lucide React icons
- Supabase JavaScript and SSR clients
- Zod validation
- npm

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add the values from the existing
   `Profolio` project's Connect dialog. The checked-in template contains no
   secrets.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

Useful verification commands:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Directory guide

- `src/app` — App Router pages and layouts
- `src/components/ui` — shadcn/ui primitives
- `src/components/shared` — reusable application-level presentation
- `src/components/portfolio-themes` — future independent theme integrations
- `src/components/admin` and `src/app/admin` — future admin integration boundary
- `src/lib/supabase` — browser, authenticated server, and privileged clients
- `src/lib/validation` — strict application JSON schemas
- `src/types` — shared portfolio and theme contracts
- `supabase/migrations` — versioned database and Storage schema
- `src/config` — future typed application configuration

Environment variables are documented in `.env.example`. Local environment
files are excluded from Git.

## Supabase backend

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Use `src/lib/supabase/client.ts` in future Client Components and
`src/lib/supabase/server.ts` in Server Components, Server Actions, and Route
Handlers. The latter carries the signed-in user's cookies and respects RLS.

`src/lib/supabase/admin.ts` is a server-only privilege boundary. It must only be
created after explicit server-side authorization and must never be imported by
a Client Component. Its service-role key is checked when the client is created,
not during unrelated builds.

The root `proxy.ts` refreshes Supabase Auth cookies with validated claims. It
does not protect or redirect routes yet; route authorization belongs to the
authentication phase.

### Apply the migration

The initial migration is in:

```text
supabase/migrations/20260827000000_initial_profolio_schema.sql
```

Only link and push after confirming the target reference belongs to the existing
`Profolio` project:

```bash
npx supabase login
npx supabase link --project-ref <profolio-project-ref>
npx supabase projects list
npx supabase migration list
npx supabase db push
```

Never use `db reset --linked` against this project; it is destructive.

### Generate database types

After the migration has been applied successfully, generate types from the
linked project:

```bash
npx supabase gen types typescript --linked --schema public > src/types/database.ts
```

Then add the generated `Database` generic to the three Supabase client
factories. `src/types/database.ts` is intentionally absent until it can be
generated from the real schema; handwritten generated-looking types are not a
safe substitute.

### Storage buckets

- `resumes` — private, PDF only, 10 MB maximum
- `avatars` — public, JPEG/PNG/WebP, 5 MB maximum
- `theme-previews` — public and writable only by future privileged Admin logic,
  JPEG/PNG/WebP, 5 MB maximum
- `portfolio-assets` — public, JPEG/PNG/WebP, 10 MB maximum

User-owned objects use `<user_id>/...` paths enforced by Storage RLS policies.
