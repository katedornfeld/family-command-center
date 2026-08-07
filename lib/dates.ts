// Single source of truth for "today" across the app — every screen and the
// weather cron should agree on the current calendar day for the household,
// not the server process's own time zone (Vercel functions run in UTC).
export const APP_TIME_ZONE = "America/Chicago";

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Today's calendar date (YYYY-MM-DD) in APP_TIME_ZONE, computed from the
 * current instant via Intl rather than the server's local Date getters —
 * those would return UTC's calendar day on Vercel, which can be a full day
 * ahead of Chicago's for several hours around midnight UTC.
 */
export function getTodayISODate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")!.value;
  const month = parts.find((part) => part.type === "month")!.value;
  const day = parts.find((part) => part.type === "day")!.value;
  return `${year}-${month}-${day}`;
}

export function getCurrentWeekRange(todayISODate: string = getTodayISODate()): {
  start: string;
  end: string;
  days: string[];
} {
  const [year, month, day] = todayISODate.split("-").map(Number);
  const today = new Date(year, month - 1, day);
  const dayOfWeek = today.getDay(); // 0 (Sun) – 6 (Sat)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(toISODate(d));
  }

  return { start: days[0], end: days[6], days };
}

export function formatEventDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatEventTime(timeStr: string | null): string {
  if (!timeStr) return "";
  const [hourStr, minuteStr] = timeStr.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

// Safety cap so a mistyped end date (or "every day for 10 years") can't
// generate an unbounded number of rows in one insert.
export const MAX_RECURRING_OCCURRENCES = 200;

// Adds `months` to `date`, clamping the day-of-month to the target month's
// last day instead of letting it roll over (native Date math would turn
// Jan 31 + 1 month into Mar 3, skipping February entirely).
function addMonthsClamped(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const daysInTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), daysInTargetMonth));
  return target;
}

/**
 * Expands a repeating event into concrete occurrence dates (inclusive of
 * both `startDate` and `untilDate`), for insertion as individual `events`
 * rows — this app has no recurrence-rule column, so each occurrence is
 * stored as its own row.
 */
export function generateRecurringDates(
  startDate: string,
  frequency: RecurrenceFrequency,
  untilDate: string,
): { dates: string[]; truncated: boolean } {
  const [year, month, day] = startDate.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const dates: string[] = [];

  for (let i = 0; dates.length < MAX_RECURRING_OCCURRENCES; i++) {
    const occurrence =
      frequency === "daily"
        ? new Date(year, month - 1, day + i)
        : frequency === "weekly"
          ? new Date(year, month - 1, day + i * 7)
          : addMonthsClamped(start, i);
    const iso = toISODate(occurrence);
    if (iso > untilDate) break;
    dates.push(iso);
  }

  const truncated =
    dates.length === MAX_RECURRING_OCCURRENCES && dates[dates.length - 1] < untilDate;

  return { dates, truncated };
}
