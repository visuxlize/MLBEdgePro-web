import { Skeleton } from "@/components/ui/skeleton";

export default function PropsLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44 bg-white/[0.05]" />
        <Skeleton className="h-4 w-60 bg-white/[0.04]" />
      </div>
      {/* Filter row */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}
