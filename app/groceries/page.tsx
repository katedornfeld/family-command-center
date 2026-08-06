import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { GroceriesClient } from "@/components/groceries/groceries-client";
import { supabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default async function GroceriesPage() {
  const { data, error } = await supabase
    .from("grocery_items")
    .select("*")
    .order("purchased", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <PageContainer>
      <PageHeader title="Grocery List" />

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Something went wrong loading your data. Please try again.
        </p>
      ) : (
        <GroceriesClient items={data ?? []} />
      )}
    </PageContainer>
  );
}
