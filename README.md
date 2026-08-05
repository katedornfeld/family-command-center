# Family Command Center

A shared, single-family app for the day's schedule, weather, weekly meal plan, and grocery list — built with Next.js (App Router) and TypeScript, backed by Supabase.

This is the MVP scope defined in Assignment 5A / the project's Build Bible. See `supabase/` for the database schema and sample seed data.

## Screens

- `/` — Dashboard: today's schedule, weather, dinner, and open grocery items
- `/calendar` — Family Calendar: add/edit/delete events
- `/meals` — Weekly Meal Planner: Claude-assisted meal recommendations, reviewed and approved by the user
- `/groceries` — Shared Grocery List: add/edit/delete/mark items purchased

This is currently a project shell — routes, navigation, and layout only. Supabase data wiring, the Claude meal-planning call, and the daily weather cron job are not yet implemented.

## Getting Started

Install dependencies and run the dev server:

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
