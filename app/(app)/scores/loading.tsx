import { Skeleton } from "@/components/ui/skeleton";

export default function ScoresLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36 bg-white/[0.05]" />
        <Skeleton className="h-4 w-56 bg-white/[0.04]" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}
