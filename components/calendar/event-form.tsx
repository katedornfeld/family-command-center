"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateRecurringDates, MAX_RECURRING_OCCURRENCES } from "@/lib/dates";
import type { RecurrenceFrequency } from "@/lib/dates";
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
  const [repeatFrequency, setRepeatFrequency] = useState<RecurrenceFrequency | "none">("none");
  const [repeatUntil, setRepeatUntil] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recurrencePreview =
    mode === "add" && repeatFrequency !== "none" && eventDate && repeatUntil >= eventDate
      ? generateRecurringDates(eventDate, repeatFrequency, repeatUntil)
      : null;

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

    let occurrenceDates = [eventDate];
    if (mode === "add" && repeatFrequency !== "none") {
      if (!repeatUntil) {
        setError("Choose a repeat end date.");
        return;
      }
      if (repeatUntil < eventDate) {
        setError("Repeat end date can't be before the event date.");
        return;
      }
      const { dates, truncated } = generateRecurringDates(eventDate, repeatFrequency, repeatUntil);
      if (truncated) {
        setError(
          `That repeats more than ${MAX_RECURRING_OCCURRENCES} times — choose a shorter end date or a less frequent repeat.`,
        );
        return;
      }
      occurrenceDates = dates;
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
        ? await supabase.from("events").insert(
            occurrenceDates.map((date) => ({
              ...payload,
              event_date: date,
              is_recurring: occurrenceDates.length > 1,
            })),
          )
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

          {mode === "add" ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Repeat</span>
              <select
                value={repeatFrequency}
                onChange={(e) => setRepeatFrequency(e.target.value as RecurrenceFrequency | "none")}
                className={inputClasses}
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
          ) : null}

          {mode === "add" && repeatFrequency !== "none" ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Repeat Until</span>
              <input
                type="date"
                value={repeatUntil}
                onChange={(e) => setRepeatUntil(e.target.value)}
                min={eventDate || undefined}
                required
                className={inputClasses}
              />
            </label>
          ) : null}

          {recurrencePreview ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:col-span-2">
              {recurrencePreview.truncated
                ? `That's more than ${MAX_RECURRING_OCCURRENCES} occurrences — choose a shorter end date or a less frequent repeat.`
                : `This will create ${recurrencePreview.dates.length} event${
                    recurrencePreview.dates.length === 1 ? "" : "s"
                  }.`}
            </p>
          ) : null}

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
