"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import type { EventRow, EventType, FamilyMember } from "@/types/database";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "appointment", label: "Appointment" },
  { value: "activity", label: "Activity" },
  { value: "birthday", label: "Birthday" },
  { value: "work", label: "Work" },
  { value: "school", label: "School" },
];

const inputClasses =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export function EventForm({
  mode,
  event,
  familyMembers,
  onCancel,
  onSaved,
}: {
  mode: "add" | "edit";
  event?: EventRow;
  familyMembers: FamilyMember[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [eventDate, setEventDate] = useState(event?.event_date ?? "");
  const [startTime, setStartTime] = useState(event?.start_time?.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(event?.end_time?.slice(0, 5) ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [familyMemberId, setFamilyMemberId] = useState(event?.family_member_id ?? "");
  const [eventType, setEventType] = useState<EventType>(event?.event_type ?? "appointment");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !eventDate) {
      setError("Title and date are required.");
      return;
    }
    if (startTime && endTime && endTime < startTime) {
      setError("End time can't be before start time.");
      return;
    }

    setSubmitting(true);

    const payload = {
      title: title.trim(),
      event_date: eventDate,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location.trim() || null,
      family_member_id: familyMemberId || null,
      event_type: eventType,
      notes: notes.trim() || null,
    };

    const { error: saveError } =
      mode === "add"
        ? await supabase.from("events").insert([payload])
        : await supabase.from("events").update(payload).eq("id", event!.id);

    setSubmitting(false);

    if (saveError) {
      setError("Something went wrong saving this event. Please try again.");
      return;
    }

    onSaved();
  }

  return (
    <Card title={mode === "add" ? "Add Event" : "Edit Event"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClasses}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Date</span>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              className={inputClasses}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Event Type</span>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className={inputClasses}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Start Time</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClasses}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">End Time</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClasses}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Who</span>
            <select
              value={familyMemberId}
              onChange={(e) => setFamilyMemberId(e.target.value)}
              className={inputClasses}
            >
              <option value="">Whole Family</option>
              {familyMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Location</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClasses}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputClasses}
            />
          </label>
        </div>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving…" : mode === "add" ? "Add Event" : "Save Changes"}
          </Button>
          <Button type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
