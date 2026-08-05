"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { EventForm } from "./event-form";
import { formatEventDate, formatEventTime, WEEKDAY_LABELS } from "@/lib/dates";
import { supabase } from "@/lib/supabase/client";
import type { EventRow, FamilyMember } from "@/types/database";

type FormState = { mode: "add" } | { mode: "edit"; event: EventRow } | null;

export function CalendarClient({
  weekDays,
  weekEvents,
  upcomingEvents,
  familyMembers,
}: {
  weekDays: string[];
  weekEvents: EventRow[];
  upcomingEvents: EventRow[];
  familyMembers: FamilyMember[];
}) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const memberById = new Map(familyMembers.map((m) => [m.id, m]));

  async function handleDelete(event: EventRow) {
    if (!window.confirm(`Delete "${event.title}"? This can't be undone.`)) return;
    setDeleteError(null);
    setDeletingId(event.id);
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    setDeletingId(null);
    if (error) {
      setDeleteError("Couldn't delete this event. Please try again.");
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
      <Card title="Weekly View">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {weekDays.map((date, i) => {
            const dayEvents = weekEvents.filter((e) => e.event_date === date);
            return (
              <div
                key={date}
                className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <p className="mb-2 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  {WEEKDAY_LABELS[i]}
                </p>
                {dayEvents.length === 0 ? (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">No events</p>
                ) : (
                  <ul className="space-y-1.5">
                    {dayEvents.map((event) => (
                      <li key={event.id} className="text-xs text-zinc-700 dark:text-zinc-300">
                        <span className="font-medium">{event.title}</span>
                        {event.start_time ? (
                          <span className="block text-zinc-400 dark:text-zinc-500">
                            {formatEventTime(event.start_time)}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Upcoming Family Events">
        <div className="mb-4">
          <Button variant="primary" onClick={() => setFormState({ mode: "add" })}>
            Add Event
          </Button>
        </div>

        {deleteError ? (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
        ) : null}

        {upcomingEvents.length === 0 ? (
          <EmptyState message="No events added yet. Add your first event to get started." />
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {upcomingEvents.map((event) => {
              const member = event.family_member_id
                ? memberById.get(event.family_member_id)
                : null;
              return (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {event.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatEventDate(event.event_date)}
                      {event.start_time ? ` · ${formatEventTime(event.start_time)}` : ""}
                      {event.end_time ? `–${formatEventTime(event.end_time)}` : ""}
                      {member ? ` · ${member.name}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setFormState({ mode: "edit", event })}>Edit</Button>
                    <Button onClick={() => handleDelete(event)} disabled={deletingId === event.id}>
                      {deletingId === event.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {formState ? (
        <EventForm
          mode={formState.mode}
          event={formState.mode === "edit" ? formState.event : undefined}
          familyMembers={familyMembers}
          onCancel={() => setFormState(null)}
          onSaved={handleFormSaved}
        />
      ) : null}
    </div>
  );
}
