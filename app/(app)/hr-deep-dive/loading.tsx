import { Skeleton } from "@/components/ui/skeleton";

export default function HRDeepDiveLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44 bg-white/[0.05]" />
        <Skeleton className="h-4 w-64 bg-white/[0.04]" />
      </div>
      {/* Hero card */}
      <Skeleton className="h-64 rounded-2xl bg-white/[0.04]" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}
