import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MealsPage() {
  return (
    <PageContainer>
      <PageHeader title="Weekly Meal Planner" />

      <div className="flex flex-col gap-4">
        <Card title="Meal Slots">
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {WEEK_DAYS.map((day) => (
              <li key={day} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{day}</span>
                <span className="text-zinc-400 dark:text-zinc-500">No meal planned yet</span>
              </li>
            ))}
          </ul>
        </Card>

        <div>
          <Button variant="primary" disabled title="Coming soon">
            Generate Weekly Meal Plan
          </Button>
        </div>

        <Card title="Claude's Recommendations">
          <EmptyState message="No meal plan yet for this week — click Generate Weekly Meal Plan to get started." />
        </Card>

        <div>
          <Button disabled title="Coming soon">
            Approve Meal Plan
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
