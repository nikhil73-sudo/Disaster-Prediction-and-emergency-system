# SurakshaNet

Disaster awareness and personal safety app. It tells you in one glance whether
your area is safe, lets you raise an SOS with your live location, and keeps
responders, shelters, supplies and volunteers on the same screen.

## What is in this repository

**Built and working**

- **Live dashboard** — a large SAFE / NOT SAFE status banner driven by your
  location and the active alert for that area, a prominent SOS button, quick
  emergency calls, live alert feed, and weather / earthquake panels.
- **SOS flow** — sends your coordinates and status to the control room.
- **Live map** — alert and shelter positions on a lazy-loaded Leaflet map.
- **Realtime updates** — new alerts and incidents arrive without a refresh.
- **Database setup** — one SQL script that creates the alerts, shelters,
  incidents, SOS and roles tables, their access rules (row level security),
  and the sample data.

**Planned next** — see `roadmap.md`.

## Tech stack

- [TanStack Start](https://tanstack.com/start) (React 19, TypeScript, Vite)
- Tailwind CSS v4 with semantic severity colours: red = critical,
  orange = high, yellow = moderate, green = safe
- Supabase for the database, realtime and auth
- Leaflet for maps, Recharts for the admin charts

## Run it locally

You need Node.js 20+ and your own Supabase project (create one free at
supabase.com, or use any Postgres-compatible project you already have).

```sh
git clone <this-repository-url>
cd surakshanet
npm install
```

Create a `.env` file in the project root with your own project's details:

```sh
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

Apply the database setup script (`drizzle/migrations/0000_migration.sql`) in
your Supabase project's SQL editor — it creates the tables, access rules and
sample data — then start the app:

```sh
npm run dev
```

`.env` is ignored by git on purpose, so your connection keys never get pushed.

## Project layout

```text
src/
  routes/        pages: / (dashboard) and /sos
  components/    header, live map, weather & earthquake panels
  hooks/         realtime alert subscriptions, browser location
  lib/           disaster helpers and error handling
  integrations/  generated Supabase client (do not edit by hand)
  styles.css     design tokens (severity colours, fonts, spacing)
drizzle/
  schema.ts                    table definitions
  migrations/0000_migration.sql  full database setup + sample data
supabase/        project configuration
```

## Scripts

| Command            | What it does                       |
| ------------------ | ---------------------------------- |
| `npm run dev`      | start the app locally              |
| `npm run build`    | production build                   |
| `npm run test`     | run the test suite (Vitest)        |
| `npm run lint`     | check code style                   |

## Notes

- Roles are `admin`, `responder` and `citizen`, stored in `public.user_roles`
  and checked with the `has_role()` function.
- Alerts are readable by anyone; only admins can change them.
- Languages: English today, with Hindi and Telugu planned.
