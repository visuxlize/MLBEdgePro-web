import { Suspense } from "react";
import { UpgradeContent } from "./upgrade-content";
import { Skeleton } from "@/components/ui/skeleton";

function UpgradeSkeleton() {
  return (
    <div className="min-h-screen bg-background max-w-5xl mx-auto px-5 sm:px-8 py-12">
      <Skeleton className="h-4 w-24 mb-10 bg-white/[0.05]" />
      <div className="flex flex-col items-center gap-4 mb-14">
        <Skeleton className="h-6 w-40 rounded-full bg-white/[0.05]" />
        <Skeleton className="h-12 w-72 bg-white/[0.05]" />
        <Skeleton className="h-4 w-56 bg-white/[0.05]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-96 rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<UpgradeSkeleton />}>
      <UpgradeContent />
    </Suspense>
  );
}
