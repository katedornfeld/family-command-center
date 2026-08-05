import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function GroceriesPage() {
  return (
    <PageContainer>
      <PageHeader title="Grocery List" />

      <div className="flex flex-col gap-4">
        <Card title="Checklist">
          <EmptyState message="Your grocery list is empty. Add an item to get started." />
        </Card>

        <div>
          <Button variant="primary" disabled title="Coming soon">
            Add Item
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
