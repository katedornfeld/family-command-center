import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/claude/client";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getCurrentWeekRange } from "@/lib/dates";
import {
  buildDailyContext,
  buildUserPrompt,
  MEAL_PLAN_JSON_SCHEMA,
  MEAL_PLAN_SYSTEM_PROMPT,
} from "@/lib/claude/prompt";
import { mealPlanResponseSchema, validateCoversExpectedDates } from "@/lib/validation/meal-plan";

// Claude can take a while to reason through a week of context; give this
// route more headroom than the platform default so a slower response isn't
// cut off. 60s is supported on every current Vercel plan, including Hobby.
export const maxDuration = 60;

const REQUEST_TIMEOUT_MS = 55_000;
const GENERIC_RETRY_MESSAGE =
  "Couldn't generate suggestions right now. Try again, or add meals manually.";

export async function POST() {
  const { start, end, days } = getCurrentWeekRange();

  // 1. Read this week's events and weather.
  const [eventsResult, weatherResult] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select("*")
      .gte("event_date", start)
      .lte("event_date", end)
      .eq("is_cancelled", false),
    supabaseAdmin
      .from("weather_forecasts")
      .select("*")
      .gte("forecast_date", start)
      .lte("forecast_date", end),
  ]);

  if (eventsResult.error || weatherResult.error) {
    console.error("[meal-plan/generate] Supabase read error:", {
      eventsError: eventsResult.error,
      weatherError: weatherResult.error,
    });
    return NextResponse.json(
      { error: "Something went wrong loading your schedule and weather. Please try again." },
      { status: 500 },
    );
  }

  // 2. Structure the context and call Claude, requiring valid JSON only.
  const dailyContext = buildDailyContext(days, eventsResult.data ?? [], weatherResult.data ?? []);

  let rawResponseText: string;
  try {
    const response = await anthropic.messages.create(
      {
        model: "claude-opus-5",
        max_tokens: 8000,
        output_config: {
          effort: "medium",
          format: { type: "json_schema", schema: MEAL_PLAN_JSON_SCHEMA },
        },
        system: MEAL_PLAN_SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(dailyContext) }],
      },
      { timeout: REQUEST_TIMEOUT_MS },
    );

    if (response.stop_reason === "refusal") {
      console.error("[meal-plan/generate] Claude refused the request.");
      return NextResponse.json({ error: GENERIC_RETRY_MESSAGE }, { status: 422 });
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.error(
        "[meal-plan/generate] Claude response had no text block. stop_reason:",
        response.stop_reason,
      );
      return NextResponse.json({ error: GENERIC_RETRY_MESSAGE }, { status: 422 });
    }
    rawResponseText = textBlock.text;
  } catch (err) {
    // TEMP DEBUG — remove once real-database/API verification is complete.
    // Logs the error object server-side only; never logs the API key or
    // the full prompt.
    console.error("[meal-plan/generate] Claude API call failed:", err);

    if (err instanceof Anthropic.APIConnectionError) {
      return NextResponse.json(
        { error: "This is taking longer than expected. Please try again." },
        { status: 504 },
      );
    }
    return NextResponse.json({ error: GENERIC_RETRY_MESSAGE }, { status: 500 });
  }

  // 3. Validate Claude's JSON before writing anything.
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawResponseText);
  } catch (err) {
    console.error("[meal-plan/generate] Claude response was not valid JSON:", err);
    return NextResponse.json({ error: GENERIC_RETRY_MESSAGE }, { status: 422 });
  }

  const parseResult = mealPlanResponseSchema.safeParse(parsedJson);
  if (!parseResult.success) {
    console.error(
      "[meal-plan/generate] Claude response failed schema validation:",
      parseResult.error.format(),
    );
    return NextResponse.json({ error: GENERIC_RETRY_MESSAGE }, { status: 422 });
  }

  const coverageCheck = validateCoversExpectedDates(parseResult.data.recommendations, days);
  if (!coverageCheck.valid) {
    console.error(
      "[meal-plan/generate] Claude response failed coverage validation:",
      coverageCheck.error,
    );
    return NextResponse.json({ error: GENERIC_RETRY_MESSAGE }, { status: 422 });
  }

  // 4. Save. Duplicate-handling rule: replace this week's prior *unreviewed*
  // Claude suggestions (source = claude, status = suggested) with the fresh
  // batch; preserve manually-entered rows and anything already
  // approved/edited untouched. Insert the new suggestions FIRST, then clean
  // up the old ones by their captured IDs — never delete-then-insert, so a
  // failed insert can never leave the week with zero suggestions.
  const { data: staleSuggestions, error: staleReadError } = await supabaseAdmin
    .from("meal_plans")
    .select("id")
    .gte("plan_date", start)
    .lte("plan_date", end)
    .eq("source", "claude")
    .eq("status", "suggested");

  if (staleReadError) {
    console.error("[meal-plan/generate] Failed to read prior suggestions:", staleReadError);
    return NextResponse.json(
      { error: "Something went wrong saving your meal plan. Please try again." },
      { status: 500 },
    );
  }

  // Claude never decides a meal is approved — that's always forced here,
  // regardless of anything the model might have returned.
  const newRows = parseResult.data.recommendations.map((rec) => ({
    plan_date: rec.date,
    meal_name: rec.meal_name,
    description: rec.description || null,
    prep_note: rec.prep_note || null,
    reason: rec.reason || null,
    source: "claude" as const,
    status: "suggested" as const,
  }));

  const { data: insertedRows, error: insertError } = await supabaseAdmin
    .from("meal_plans")
    .insert(newRows)
    .select();

  if (insertError) {
    console.error("[meal-plan/generate] Failed to save recommendations:", insertError);
    return NextResponse.json(
      { error: "Something went wrong saving your meal plan. Please try again." },
      { status: 500 },
    );
  }

  const staleIds = (staleSuggestions ?? []).map((row) => row.id);
  if (staleIds.length > 0) {
    const { error: cleanupError } = await supabaseAdmin
      .from("meal_plans")
      .delete()
      .in("id", staleIds);
    if (cleanupError) {
      // Partial-failure case: the new suggestions saved successfully, but
      // the old ones couldn't be cleared. Not fatal — the Meal Planner UI
      // already handles multiple rows per day — but worth surfacing here.
      console.error(
        "[meal-plan/generate] Saved new suggestions but failed to clear old ones:",
        cleanupError,
      );
    }
  }

  // 5. Return the saved rows.
  return NextResponse.json({ recommendations: insertedRows }, { status: 200 });
}
