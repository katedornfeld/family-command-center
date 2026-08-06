"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import type { GroceryItem } from "@/types/database";

const CATEGORY_SUGGESTIONS = ["produce", "dairy", "meat", "pantry", "frozen", "household"];

const inputClasses =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export function ItemForm({
  mode,
  item,
  onCancel,
  onSaved,
}: {
  mode: "add" | "edit";
  item?: GroceryItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [itemName, setItemName] = useState(item?.item_name ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [quantity, setQuantity] = useState(item?.quantity ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!itemName.trim()) {
      setError("Item name is required.");
      return;
    }

    setSubmitting(true);

    const payload = {
      item_name: itemName.trim(),
      category: category.trim() || null,
      quantity: quantity.trim() || null,
      notes: notes.trim() || null,
    };

    const { error: saveError } =
      mode === "add"
        ? await supabase.from("grocery_items").insert([payload])
        : await supabase.from("grocery_items").update(payload).eq("id", item!.id);

    setSubmitting(false);

    if (saveError) {
      setError("Something went wrong saving this item. Please try again.");
      return;
    }

    onSaved();
  }

  return (
    <Card title={mode === "add" ? "Add Item" : "Edit Item"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Item Name</span>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              className={inputClasses}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Category</span>
            <input
              type="text"
              list="grocery-category-suggestions"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClasses}
            />
            <datalist id="grocery-category-suggestions">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Quantity</span>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder='e.g. "2" or "1 gallon"'
              className={inputClasses}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Notes</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. preferred brand"
              className={inputClasses}
            />
          </label>
        </div>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving…" : mode === "add" ? "Add Item" : "Save Changes"}
          </Button>
          <Button type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
