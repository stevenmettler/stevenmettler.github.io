@AGENTS.md

# Project: stevenmettler.com (this app)

This is the real, live site. See the repo root `CLAUDE.md` for the split between this app and the legacy static site at the repo root.
Only make changes in `web/` unless an issue explicitly says otherwise.

## Stack

- Next.js 16 (App Router), React 19, TypeScript.
- next-auth (beta) for authentication.
- drizzle-orm + pg (Postgres) for the database.
- Deployed on Vercel (see `web/.vercel/project.json`).

## Commands

Run these from `web/`.

- Lint: `npm run lint`
- Build (also typechecks): `npm run build`
- Dev server: `npm run dev`

There is no automated test suite yet.
Lint and build are the only automated pass/fail signal available.
Do not claim tests passed if none exist - report lint/build results only.

## Definition of done

- Change is scoped to the issue, nothing extra.
- `npm run lint` and `npm run build` both pass before the PR opens.
- PR description states what changed, why, and what was verified.

## Do not touch without an explicit issue instruction

- `web/src/auth.ts`, `web/src/app/api/auth/`, `web/src/types/next-auth.d.ts` - authentication and session handling.
- `web/drizzle/`, `web/drizzle.config.ts`, `web/src/db/` - anything requiring a database migration.
- `web/.env.local`, `web/.env.example`, GitHub Secrets, CI credentials.
- `web/.vercel/` deployment configuration.
