import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const mealRecommendationSchema = z.object({
  date: z.string().regex(DATE_REGEX, "date must be YYYY-MM-DD"),
  meal_name: z.string().trim().min(1, "meal_name is required"),
  description: z.string().trim(),
  prep_note: z.string().trim(),
  reason: z.string().trim(),
});

export const mealPlanResponseSchema = z.object({
  recommendations: z.array(mealRecommendationSchema),
});

export type MealRecommendation = z.infer<typeof mealRecommendationSchema>;
export type MealPlanResponse = z.infer<typeof mealPlanResponseSchema>;

/**
 * Confirms the response has exactly one recommendation per expected date —
 * no duplicates, nothing out of range, nothing missing.
 */
export function validateCoversExpectedDates(
  recommendations: MealRecommendation[],
  expectedDates: string[],
): { valid: true } | { valid: false; error: string } {
  const expected = new Set(expectedDates);
  const seen = new Set<string>();

  for (const rec of recommendations) {
    if (!expected.has(rec.date)) {
      return { valid: false, error: `Unexpected date in response: ${rec.date}` };
    }
    if (seen.has(rec.date)) {
      return { valid: false, error: `Duplicate date in response: ${rec.date}` };
    }
    seen.add(rec.date);
  }

  if (seen.size !== expected.size) {
    const missing = expectedDates.filter((d) => !seen.has(d));
    return { valid: false, error: `Missing recommendations for: ${missing.join(", ")}` };
  }

  return { valid: true };
}
