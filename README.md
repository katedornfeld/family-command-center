# Family Command Center

A shared, single-family app for the day's schedule, weather, weekly meal plan, and grocery list — built with Next.js (App Router) and TypeScript, backed by Supabase.

This is the MVP scope defined in Assignment 5A / the project's Build Bible. See `supabase/` for the database schema and sample seed data.

## Screens

- `/` — Dashboard: today's schedule, weather, dinner, and open grocery items
- `/calendar` — Family Calendar: add/edit/delete events
- `/meals` — Weekly Meal Planner: Claude-assisted meal recommendations, reviewed and approved by the user
- `/groceries` — Shared Grocery List: add/edit/delete/mark items purchased

The Family Calendar is connected to Supabase (`events` and `family_members`). The other three screens are still shell/placeholder UI. The Claude meal-planning call and the daily weather cron job are not yet implemented.

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in your Supabase project's URL and anon key (Project Settings → API in the Supabase dashboard). Required as of the Family Calendar being wired up — `npm run build` and any page under `/calendar` will fail without them.
2. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Database

The Supabase schema and seed data live in `supabase/migrations/` and `supabase/seed/`. Run them in order in the Supabase SQL Editor:

1. `supabase/migrations/0001_create_core_schema.sql`
2. `supabase/migrations/0002_add_family_member_details.sql`
3. `supabase/seed/seed_sample_data.sql` (optional sample data)
