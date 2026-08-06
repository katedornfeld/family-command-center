import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { MealPlannerClient } from "@/components/meals/meal-planner-client";
import { getCurrentWeekRange } from "@/lib/dates";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default async function MealsPage() {
  const { start, end, days } = getCurrentWeekRange();

  const { data, error } = await supabase
    .from("meal_plans")
    .select("*")
    .gte("plan_date", start)
    .lte("plan_date", end)
    .order("plan_date", { ascending: true })
    .order("created_at", { ascending: true });

  // TEMP DEBUG — remove once real-database verification is complete. Logs
  // the full PostgrestError object server-side only; never logs env values.
  if (error) {
    console.error("[meals] meal_plans error:", error);
  }

  return (
    <PageContainer>
      <PageHeader title="Weekly Meal Planner" />

      {error ? (
        <ErrorState message="Something went wrong loading your data. Please try again." />
      ) : (
        <MealPlannerClient weekDays={days} mealPlans={data ?? []} />
      )}
    </PageContainer>
  );
}
