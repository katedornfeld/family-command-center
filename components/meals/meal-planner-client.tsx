"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MealForm } from "./meal-form";
import { supabase } from "@/lib/supabase/client";
import type { MealPlan, MealStatus } from "@/types/database";

type FormState =
  | { mode: "add"; planDate: string }
  | { mode: "edit"; planDate: string; meal: MealPlan }
  | null;

const STATUS_BADGE_CLASSES: Record<MealStatus, string> = {
  suggested: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  edited: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  rejected: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function StatusBadge({ status }: { status: MealStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE_CLASSES[status]}`}
    >
      {status}
    </span>
  );
}

function formatDayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export function MealPlannerClient({
  weekDays,
  mealPlans,
}: {
  weekDays: string[];
  mealPlans: MealPlan[];
}) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const mealsByDate = new Map<string, MealPlan[]>();
  for (const meal of mealPlans) {
    const existing = mealsByDate.get(meal.plan_date) ?? [];
    existing.push(meal);
    mealsByDate.set(meal.plan_date, existing);
  }

  async function handleApprove(meal: MealPlan) {
    setActionError(null);
    setApprovingId(meal.id);
    const { error } = await supabase
      .from("meal_plans")
      .update({ status: "approved" })
      .eq("id", meal.id);
    setApprovingId(null);
    if (error) {
      setActionError("Couldn't approve this meal. Please try again.");
      return;
    }
    router.refresh();
  }

  async function handleReject(meal: MealPlan) {
    if (!window.confirm(`Remove "${meal.meal_name}" from this day?`)) return;
    setActionError(null);
    setRemovingId(meal.id);
    const { error } = await supabase.from("meal_plans").delete().eq("id", meal.id);
    setRemovingId(null);
    if (error) {
      setActionError("Couldn't remove this meal. Please try again.");
      return;
    }
    router.refresh();
  }

  function handleFormSaved() {
    setFormState(null);
    router.refresh();
  }

  const hasAnyMeals = mealPlans.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <Card title="Meal Slots">
        {actionError ? (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>
        ) : null}

        <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {weekDays.map((date) => {
            const dayMeals = mealsByDate.get(date) ?? [];
            return (
              <div key={date} className="py-4 first:pt-0 last:pb-0">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {formatDayLabel(date)}
                  </p>
                  <Button onClick={() => setFormState({ mode: "add", planDate: date })}>
                    Add Meal
                  </Button>
                </div>

                {dayMeals.length === 0 ? (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">No meal planned yet</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {dayMeals.map((meal) => (
                      <li
                        key={meal.id}
                        className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                {meal.meal_name}
                              </span>
                              <StatusBadge status={meal.status} />
                              <span className="text-xs capitalize text-zinc-400 dark:text-zinc-500">
                                {meal.source}
                              </span>
                            </div>
                            {meal.description ? (
                              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                                {meal.description}
                              </p>
                            ) : null}
                            {meal.prep_note ? (
                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                Prep note: {meal.prep_note}
                              </p>
                            ) : null}
                            {meal.reason ? (
                              <p className="mt-1 text-xs italic text-zinc-500 dark:text-zinc-400">
                                {meal.reason}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {meal.status !== "approved" ? (
                              <Button
                                onClick={() => handleApprove(meal)}
                                disabled={approvingId === meal.id}
                              >
                                {approvingId === meal.id ? "Approving…" : "Approve"}
                              </Button>
                            ) : null}
                            <Button
                              onClick={() =>
                                setFormState({ mode: "edit", planDate: date, meal })
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleReject(meal)}
                              disabled={removingId === meal.id}
                            >
                              {removingId === meal.id ? "Removing…" : "Reject"}
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        <div>
          <Button variant="primary" disabled title="Claude integration not yet connected">
            Generate Weekly Meal Plan
          </Button>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Claude-powered generation isn&apos;t connected yet — this button will call the Claude
          API in a later step. Add or edit meals manually above for now.
        </p>
      </div>

      <Card title="Claude's Recommendations">
        {hasAnyMeals ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Claude-generated suggestions will appear here once the Claude integration is
            connected. Existing meals for this week are shown in Meal Slots above.
          </p>
        ) : (
          <EmptyState message="No meal plan yet for this week — click Generate Weekly Meal Plan to get started." />
        )}
      </Card>

      {formState ? (
        <MealForm
          mode={formState.mode}
          planDate={formState.planDate}
          dateLabel={formatDayLabel(formState.planDate)}
          meal={formState.mode === "edit" ? formState.meal : undefined}
          onCancel={() => setFormState(null)}
          onSaved={handleFormSaved}
        />
      ) : null}
    </div>
  );
}
