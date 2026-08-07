# Family Command Center

A shared, single-family app for the day's schedule, weather, weekly meal plan, and grocery list — built with Next.js (App Router) and TypeScript, backed by Supabase.

This is the MVP scope defined in Assignment 5A / the project's Build Bible. See `supabase/` for the database schema and sample seed data.

## Screens

- `/` — Dashboard: today's schedule, weather, dinner, and open grocery items
- `/calendar` — Family Calendar: add/edit/delete events
- `/meals` — Weekly Meal Planner: Claude-assisted meal recommendations, reviewed and approved by the user
- `/groceries` — Shared Grocery List: add/edit/delete/mark items purchased

All four screens are connected to Supabase. The Weekly Meal Planner's "Generate Weekly Meal Plan" button calls the Claude API (`POST /api/meal-plan/generate`) to suggest one dinner per day for the current week. A daily Vercel Cron job (`GET /api/cron/weather`, see below) refreshes today's weather forecast.

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in the values from your Supabase project (Project Settings → API), your Anthropic API key (console.anthropic.com/settings/keys), and a WeatherAPI.com key (weatherapi.com/signup.aspx). `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required for the app to build or run at all; the rest are required for their specific server-only routes (never exposed to the browser).
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

## Daily Weather Cron Job

`GET /api/cron/weather` fetches today's forecast from WeatherAPI.com and upserts it into `weather_forecasts`, keyed on `forecast_date` (updates the existing row for today rather than creating a duplicate). Scheduled via `vercel.json` to run once daily at 06:00 UTC — Vercel Cron schedules are always UTC; adjust the `schedule` field there if you want a different time.

**Locally, before deploying:** with `npm run dev` running and `CRON_SECRET`/`WEATHER_API_KEY`/`WEATHER_LOCATION` set in `.env.local`, open this URL directly in your browser:

```
http://localhost:3000/api/cron/weather?cron_secret=YOUR_CRON_SECRET
```

You should see a JSON response like `{"status":"ok","date":"2026-08-10","forecast":{...},"updated_at":"..."}`. Run it twice in a row and confirm in Supabase's Table Editor that it updated the same row for today rather than adding a second one.

**In production**, Vercel Cron sends the secret automatically as an `Authorization: Bearer <CRON_SECRET>` header — the `?cron_secret=` query parameter is only needed for manual/local testing via a browser, which can't set custom headers by just navigating to a URL.
