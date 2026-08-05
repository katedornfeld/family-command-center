import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage() {
  return (
    <PageContainer>
      <PageHeader title="Family Calendar" />

      <div className="flex flex-col gap-4">
        <Card title="Weekly View">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <p className="mb-2 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  {day}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">No events</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Upcoming Family Events">
          <EmptyState message="No events added yet. Add your first event to get started." />
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button variant="primary" disabled title="Coming soon">
            Add Event
          </Button>
          <Button disabled title="Coming soon">
            Edit Event
          </Button>
          <Button disabled title="Coming soon">
            Delete Event
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
