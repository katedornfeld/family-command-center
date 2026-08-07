import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { formatEventTime } from "@/lib/dates";
import { supabase } from "@/lib/supabase/client";

// Always show "today," never a cached snapshot from build time.
export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { href: "/calendar", label: "View Calendar" },
  { href: "/meals", label: "Weekly Meal Planner" },
  { href: "/groceries", label: "Grocery List" },
];

const GROCERY_PREVIEW_LIMIT = 5;

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function DashboardPage() {
  const todayDate = new Date();
  const today = toISODate(todayDate);
  const todayLabel = todayDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [eventsResult, weatherResult, dinnerResult, groceryResult] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("event_date", today)
      .eq("is_cancelled", false)
      .order("start_time", { ascending: true, nullsFirst: false }),
    supabase.from("weather_forecasts").select("*").eq("forecast_date", today).maybeSingle(),
    supabase
      .from("meal_plans")
      .select("*")
      .eq("plan_date", today)
      .in("status", ["approved", "edited"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("grocery_items")
      .select("id, item_name")
      .eq("purchased", false)
      .order("created_at", { ascending: true }),
  ]);

  // TEMP DEBUG — remove once the Supabase error is diagnosed. Logs only the
  // message/details/hint/code fields of each PostgrestError, server-side
  // only; never logs env var values or other secrets.
  function logSupabaseError(label: string, error: { message: string; details: string; hint: string; code: string } | null) {
    if (!error) return;
    console.error(`[dashboard] ${label} error:`, {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  logSupabaseError("events", eventsResult.error);
  logSupabaseError("weather", weatherResult.error);
  logSupabaseError("dinner", dinnerResult.error);
  logSupabaseError("grocery", groceryResult.error);

  const events = eventsResult.data ?? [];
  const weather = weatherResult.data;
  const dinner = dinnerResult.data;
  const groceryItems = groceryResult.data ?? [];

  return (
    <PageContainer>
      <div className="mb-6">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Today</p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{todayLabel}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Today's Schedule">
          {eventsResult.error ? (
            <ErrorState message="Something went wrong loading your data. Please try again." />
          ) : events.length === 0 ? (
            <EmptyState message="No events scheduled for today." />
          ) : (
            <ul className="space-y-2">
              {events.map((event) => (
                <li key={event.id} className="text-sm">
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {event.title}
                  </span>
                  {event.start_time ? (
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {formatEventTime(event.start_time)}
                      {event.end_time ? `–${formatEventTime(event.end_time)}` : ""}
                      {event.location ? ` · ${event.location}` : ""}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Today's Weather">
          {weatherResult.error ? (
            <ErrorState message="Something went wrong loading your data. Please try again." />
          ) : !weather ? (
            <EmptyState message="Weather unavailable." />
          ) : (
            <div className="text-sm">
              <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                {weather.condition ? capitalize(weather.condition) : "Weather unavailable"}
              </p>
              {weather.high_temp !== null || weather.low_temp !== null ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {weather.high_temp !== null ? `High: ${Math.round(weather.high_temp)}°` : ""}
                  {weather.high_temp !== null && weather.low_temp !== null ? " · " : ""}
                  {weather.low_temp !== null ? `Low: ${Math.round(weather.low_temp)}°` : ""}
                </p>
              ) : null}
            </div>
          )}
        </Card>

        <Card title="Tonight's Dinner" className="sm:col-span-2">
          {dinnerResult.error ? (
            <ErrorState message="Something went wrong loading your data. Please try again." />
          ) : !dinner ? (
            <EmptyState message="No dinner planned yet — visit the Weekly Meal Planner." />
          ) : (
            <div className="text-sm">
              <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                {dinner.meal_name}
              </p>
              {dinner.description ? (
                <p className="mt-1 text-zinc-600 dark:text-zinc-300">{dinner.description}</p>
              ) : null}
              {dinner.prep_note ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Prep note: {dinner.prep_note}
                </p>
              ) : null}
            </div>
          )}
        </Card>

        <Card title="Grocery Reminders" className="sm:col-span-2">
          {groceryResult.error ? (
            <ErrorState message="Something went wrong loading your data. Please try again." />
          ) : groceryItems.length === 0 ? (
            <EmptyState message="Grocery list is all caught up." />
          ) : (
            <div className="text-sm">
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {groceryItems.length} item{groceryItems.length === 1 ? "" : "s"} still needed
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {groceryItems
                  .slice(0, GROCERY_PREVIEW_LIMIT)
                  .map((item) => item.item_name)
                  .join(", ")}
                {groceryItems.length > GROCERY_PREVIEW_LIMIT
                  ? `, +${groceryItems.length - GROCERY_PREVIEW_LIMIT} more`
                  : ""}
              </p>
            </div>
          )}
        </Card>

        <Card title="Quick Actions" className="sm:col-span-2">
          <div className="flex flex-wrap gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
