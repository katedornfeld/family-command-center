"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import type { MealPlan } from "@/types/database";

const inputClasses =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export function MealForm({
  mode,
  planDate,
  dateLabel,
  meal,
  onCancel,
  onSaved,
}: {
  mode: "add" | "edit";
  planDate: string;
  dateLabel: string;
  meal?: MealPlan;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [mealName, setMealName] = useState(meal?.meal_name ?? "");
  const [description, setDescription] = useState(meal?.description ?? "");
  const [prepNote, setPrepNote] = useState(meal?.prep_note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!mealName.trim()) {
      setError("Meal name is required.");
      return;
    }

    setSubmitting(true);

    if (mode === "add") {
      // A manually-added meal is the user's direct decision — no separate
      // "suggested" review step applies, so it's immediately the official
      // dinner for that day (status = approved, per the Build Bible's rule
      // that only approved/edited rows show on the Dashboard).
      const { error: saveError } = await supabase.from("meal_plans").insert([
        {
          plan_date: planDate,
          meal_name: mealName.trim(),
          description: description.trim() || null,
          prep_note: prepNote.trim() || null,
          source: "manual",
          status: "approved",
        },
      ]);
      setSubmitting(false);
      if (saveError) {
        setError("Something went wrong saving this meal. Please try again.");
        return;
      }
    } else {
      // Editing any row — suggested, approved, or already-edited — counts as
      // the user taking ownership of it, so status becomes "edited" per the
      // Build Bible's human-review rules.
      const { error: saveError } = await supabase
        .from("meal_plans")
        .update({
          meal_name: mealName.trim(),
          description: description.trim() || null,
          prep_note: prepNote.trim() || null,
          status: "edited",
        })
        .eq("id", meal!.id);
      setSubmitting(false);
      if (saveError) {
        setError("Something went wrong saving this meal. Please try again.");
        return;
      }
    }

    onSaved();
  }

  return (
    <Card title={`${mode === "add" ? "Add" : "Edit"} Meal — ${dateLabel}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Meal Name</span>
          <input
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            required
            className={inputClasses}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Description</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClasses}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Prep Note</span>
          <input
            type="text"
            value={prepNote}
            onChange={(e) => setPrepNote(e.target.value)}
            placeholder='e.g. "Start crockpot by 8am"'
            className={inputClasses}
          />
        </label>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving…" : mode === "add" ? "Add Meal" : "Save Changes"}
          </Button>
          <Button type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
