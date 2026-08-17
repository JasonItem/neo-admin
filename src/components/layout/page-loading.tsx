import { Skeleton } from "@/components/ui/skeleton";

export function PageLoading() {
  return (
    <div className="flex w-full flex-col gap-5" aria-label="页面加载中">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="flex h-11 items-center gap-3 border-b px-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
        <div className="h-[32rem]">
          <div className="grid h-10 grid-cols-6 items-center gap-4 border-b px-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-3 w-full max-w-24" />
            ))}
          </div>
          <div className="flex flex-col gap-0">
            {Array.from({ length: 7 }, (_, row) => (
              <div
                key={row}
                className="grid h-12 grid-cols-6 items-center gap-4 border-b px-3"
              >
                {Array.from({ length: 6 }, (_, column) => (
                  <Skeleton
                    key={column}
                    className="h-3 w-full max-w-28"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
