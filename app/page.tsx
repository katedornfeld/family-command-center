import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

// Always show "today," never a cached snapshot from build time.
export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { href: "/calendar", label: "View Calendar" },
  { href: "/meals", label: "Weekly Meal Planner" },
  { href: "/groceries", label: "Grocery List" },
];

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PageContainer>
      <div className="mb-6">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Today</p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{today}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Today's Schedule">
          <EmptyState message="No events scheduled for today." />
        </Card>

        <Card title="Today's Weather">
          <EmptyState message="Weather unavailable." />
        </Card>

        <Card title="Tonight's Dinner" className="sm:col-span-2">
          <EmptyState message="No dinner planned yet — visit the Weekly Meal Planner." />
        </Card>

        <Card title="Grocery Reminders" className="sm:col-span-2">
          <EmptyState message="Grocery list is all caught up." />
        </Card>

        <Card title="Quick Actions" className="sm:col-span-2">
          <div className="flex flex-wrap gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
