import type { EventRow, WeatherForecast } from "@/types/database";

export type DayContext = {
  date: string;
  weekday: string;
  events: Array<{
    title: string;
    start_time: string | null;
    end_time: string | null;
    event_type: string;
  }>;
  weather: {
    condition: string | null;
    high_temp: number | null;
    low_temp: number | null;
  } | null;
};

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function weekdayName(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()];
}

/**
 * Structures events and weather into one entry per day for Claude's context.
 * Cancelled events are excluded — they shouldn't influence meal planning.
 */
export function buildDailyContext(
  days: string[],
  events: EventRow[],
  weather: WeatherForecast[],
): DayContext[] {
  const weatherByDate = new Map(weather.map((w) => [w.forecast_date, w]));

  return days.map((date) => {
    const dayEvents = events
      .filter((e) => e.event_date === date && !e.is_cancelled)
      .map((e) => ({
        title: e.title,
        start_time: e.start_time,
        end_time: e.end_time,
        event_type: e.event_type,
      }));

    const forecast = weatherByDate.get(date);

    return {
      date,
      weekday: weekdayName(date),
      events: dayEvents,
      weather: forecast
        ? {
            condition: forecast.condition,
            high_temp: forecast.high_temp,
            low_temp: forecast.low_temp,
          }
        : null,
    };
  });
}

export const MEAL_PLAN_SYSTEM_PROMPT = `You are helping a two-parent household plan realistic, family-friendly dinners for the upcoming week.

For each day provided, recommend exactly one dinner. Weigh, per day:
- The number and timing of events, and whether the family appears to be home that evening
- How much cooking time is realistically available, and whether prep could happen earlier in the day
- Crockpot or make-ahead suitability on busy days
- Opportunities for a leftover night
- Especially busy or double-booked evenings
- Weather: favor grilling when weather is good; favor soup, casseroles, or comfort food when it's cold or rainy
- Variety across the week — avoid repeating similar meals back-to-back
- Realistic, family-friendly meals with reasonable weeknight prep effort

For each day, write a short "reason" that ties the specific recommendation to that day's actual schedule and/or weather — never a generic explanation that could apply to any day.

Respond with structured JSON only, matching the required schema exactly. Do not include any commentary outside the JSON.`;

export function buildUserPrompt(days: DayContext[]): string {
  return `Here is the family's schedule and weather forecast for the upcoming week, one entry per day:

${JSON.stringify(days, null, 2)}

Recommend one dinner for each of the ${days.length} dates listed above.`;
}

export const MEAL_PLAN_JSON_SCHEMA = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "YYYY-MM-DD, must match one of the provided dates",
          },
          meal_name: { type: "string" },
          description: { type: "string" },
          prep_note: { type: "string" },
          reason: { type: "string" },
        },
        required: ["date", "meal_name", "description", "prep_note", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["recommendations"],
  additionalProperties: false,
} as const;
