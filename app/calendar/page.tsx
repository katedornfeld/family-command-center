import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarClient } from "@/components/calendar/calendar-client";
import { getCurrentWeekRange, toISODate } from "@/lib/dates";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { start, end, days } = getCurrentWeekRange();
  const today = toISODate(new Date());

  const [weekEventsResult, upcomingEventsResult, familyMembersResult] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .gte("event_date", start)
      .lte("event_date", end)
      .order("event_date")
      .order("start_time", { ascending: true, nullsFirst: false }),
    supabase
      .from("events")
      .select("*")
      .gte("event_date", today)
      .order("event_date")
      .order("start_time", { ascending: true, nullsFirst: false })
      .limit(10),
    supabase.from("family_members").select("*").order("name"),
  ]);

  const loadError =
    weekEventsResult.error || upcomingEventsResult.error || familyMembersResult.error;

  return (
    <PageContainer>
      <PageHeader title="Family Calendar" />

      {loadError ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Something went wrong loading your data. Please try again.
        </p>
      ) : (
        <CalendarClient
          weekDays={days}
          weekEvents={weekEventsResult.data ?? []}
          upcomingEvents={upcomingEventsResult.data ?? []}
          familyMembers={familyMembersResult.data ?? []}
        />
      )}
    </PageContainer>
  );
}
