import Link from "next/link";

export function PageHeader({
  title,
  showBackToDashboard = true,
}: {
  title: string;
  showBackToDashboard?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
      {showBackToDashboard ? (
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-300"
        >
          ← Back to Dashboard
        </Link>
      ) : null}
    </div>
  );
}
