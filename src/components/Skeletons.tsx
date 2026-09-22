export function CardSkeleton({ className = "w-full" }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-white border border-slate-100 ${className}`}>
      <div className="aspect-[3/4] animate-pulse bg-slate-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RailSkeleton() {
  return (
    <div className="mt-10">
      <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
      <div className="rail-scroll mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} className="w-[160px] md:w-[180px] shrink-0" />
        ))}
      </div>
    </div>
  );
}
