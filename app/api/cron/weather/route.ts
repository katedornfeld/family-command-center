import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fetchTodayForecast, WeatherApiError } from "@/lib/weather/client";
import { toISODate } from "@/lib/dates";

// Weather fetch + one upsert should be fast; this is generous headroom in
// case the weather API is briefly slow.
export const maxDuration = 30;

/**
 * Accepts the secret either as the `Authorization: Bearer <CRON_SECRET>`
 * header — which is what Vercel Cron sends automatically once CRON_SECRET
 * is set as a project environment variable — or as a `?cron_secret=`
 * query parameter, so the route can also be triggered by pasting a URL
 * directly into a browser for local/manual testing.
 */
function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get("cron_secret") === cronSecret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    console.error("[cron/weather] Rejected request: missing or invalid CRON_SECRET.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weatherApiKey = process.env.WEATHER_API_KEY;
  const location = process.env.WEATHER_LOCATION;

  if (!weatherApiKey || !location) {
    console.error("[cron/weather] Missing WEATHER_API_KEY or WEATHER_LOCATION.");
    return NextResponse.json({ error: "Server is missing weather configuration." }, { status: 500 });
  }

  const today = toISODate(new Date());

  // 1. Fetch today's forecast. Network failures and unexpected API
  // responses are handled the same way here — both are upstream failures
  // outside our control — and existing weather_forecasts rows are left
  // untouched (never wiped on a failed fetch).
  let forecast;
  try {
    forecast = await fetchTodayForecast(weatherApiKey, location);
  } catch (err) {
    console.error("[cron/weather] Failed to fetch the weather forecast:", err);
    const message =
      err instanceof WeatherApiError ? err.message : "Failed to reach the weather API.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 2. Upsert into weather_forecasts, keyed on forecast_date, so re-runs
  // (including running this more than once a day) update the existing row
  // instead of creating a duplicate.
  const { error: upsertError } = await supabaseAdmin.from("weather_forecasts").upsert(
    {
      forecast_date: today,
      high_temp: forecast.high_temp,
      low_temp: forecast.low_temp,
      condition: forecast.condition,
      last_updated: new Date().toISOString(),
    },
    { onConflict: "forecast_date" },
  );

  if (upsertError) {
    console.error("[cron/weather] Failed to save the forecast to Supabase:", upsertError);
    return NextResponse.json({ error: "Failed to save the forecast." }, { status: 500 });
  }

  console.log(`[cron/weather] Saved forecast for ${today}:`, forecast);
  return NextResponse.json({
    status: "ok",
    date: today,
    forecast,
    updated_at: new Date().toISOString(),
  });
}
