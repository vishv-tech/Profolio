# The Architects — GNKC Hackathon 2026

This repository is the shared foundation for an application that will turn an
uploaded resume into an editable, publishable professional portfolio.

## Current phase

**Project Foundation** — routing, styling, reusable UI primitives, environment
scaffolding, and integration boundaries only. Authentication, resume parsing,
AI, persistence, themes, publishing, admin tools, and analytics are intentionally
reserved for later phases.

## Stack

- Next.js App Router with React and strict TypeScript
- Tailwind CSS
- shadcn/ui with Lucide React icons
- npm

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add local values when a later phase
   requires them. The checked-in template contains no secrets.

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
- `src/lib` — future service-specific and validation utilities
- `src/types` — future shared application contracts
- `src/config` — future typed application configuration

Environment variables are documented in `.env.example`. Local environment
files are excluded from Git.
