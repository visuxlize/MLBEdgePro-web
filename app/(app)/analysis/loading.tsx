import { Skeleton } from "@/components/ui/skeleton";

export default function AnalysisLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52 bg-white/[0.05]" />
        <Skeleton className="h-4 w-72 bg-white/[0.04]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}
