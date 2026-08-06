"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ItemForm } from "./item-form";
import { supabase } from "@/lib/supabase/client";
import type { GroceryItem } from "@/types/database";

type FormState = { mode: "add" } | { mode: "edit"; item: GroceryItem } | null;

export function GroceriesClient({ items }: { items: GroceryItem[] }) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleTogglePurchased(item: GroceryItem) {
    setActionError(null);
    setTogglingId(item.id);
    const { error } = await supabase
      .from("grocery_items")
      .update({ purchased: !item.purchased })
      .eq("id", item.id);
    setTogglingId(null);
    if (error) {
      setActionError("Couldn't update this item. Please try again.");
      return;
    }
    router.refresh();
  }

  async function handleDelete(item: GroceryItem) {
    if (!window.confirm(`Remove "${item.item_name}" from the list?`)) return;
    setActionError(null);
    setDeletingId(item.id);
    const { error } = await supabase.from("grocery_items").delete().eq("id", item.id);
    setDeletingId(null);
    if (error) {
      setActionError("Couldn't delete this item. Please try again.");
      return;
    }
    router.refresh();
  }

  function handleFormSaved() {
    setFormState(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Checklist">
        {actionError ? (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">{actionError}</p>
        ) : null}

        {items.length === 0 ? (
          <EmptyState message="Your grocery list is empty. Add an item to get started." />
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.purchased}
                    onChange={() => handleTogglePurchased(item)}
                    disabled={togglingId === item.id}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <span
                      className={`block text-sm font-medium ${
                        item.purchased
                          ? "text-zinc-400 line-through dark:text-zinc-600"
                          : "text-zinc-900 dark:text-zinc-50"
                      }`}
                    >
                      {item.item_name}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {[item.quantity, item.category, item.notes].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </label>
                <div className="flex gap-2">
                  <Button onClick={() => setFormState({ mode: "edit", item })}>Edit</Button>
                  <Button onClick={() => handleDelete(item)} disabled={deletingId === item.id}>
                    {deletingId === item.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        <Button variant="primary" onClick={() => setFormState({ mode: "add" })}>
          Add Item
        </Button>
      </div>

      {formState ? (
        <ItemForm
          mode={formState.mode}
          item={formState.mode === "edit" ? formState.item : undefined}
          onCancel={() => setFormState(null)}
          onSaved={handleFormSaved}
        />
      ) : null}
    </div>
  );
}
