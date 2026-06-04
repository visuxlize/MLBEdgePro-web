import { Skeleton } from "@/components/ui/skeleton";

export default function GamesLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-white/[0.05]" />
        <Skeleton className="h-4 w-64 bg-white/[0.04]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}
